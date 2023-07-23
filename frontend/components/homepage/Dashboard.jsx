import { useEffect, useState } from "react";

import Image from "next/image";
import { ethers } from 'ethers'
import lighthouse from '@lighthouse-web3/sdk';
import contractABI from './abi.json'
import Card from "./Card";

const { Configuration, OpenAIApi } = require("openai");

import Modal from 'react-modal';
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    width: "60%",
    transform: 'translate(-50%, -50%)',
  },
};

const Dashboard = ({ logout, loginProvider, account }) => {

  const [note, setNote] = useState('')
  const [oldNotes, setOldNotes] = useState([])
  const [chatText, setChatText] = useState()
  const [provider, setProvider] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const scw = account;

  const [modalIsOpen, setIsOpen] = useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  const fetchData = async () => {
    // Replace 'YOUR_RPC_URL' with the actual RPC URL of the blockchain network
    const pv = new ethers.providers.JsonRpcProvider('https://evm.shibuya.astar.network');
    setProvider(pv)

    const contract = new ethers.Contract(process.env.NEXT_PUBLIC_SHAKTI_CONTRACT, contractABI, pv);
    try {
      const result = await contract.getNotes(scw); // Replace 'methodName' with the actual method you want to call
      setOldNotes(result)
      console.log('Result:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  useEffect(() => {
    // setOpenAI(openai)
    fetchData()
  }, [])

  const sendTxOnChain = async (cid, hash) => {

    // One needs to prepare the transaction data
    // Here we will be transferring ERC 20 tokens from the Smart Contract Wallet to an address
    const createNoteInterface = new ethers.utils.Interface([
      'function createNote(string encryptedContentCID, string hashOfOriginalNote, address user)'
    ])
    console.log([cid, hash, scw])
    // Encode an ERC-20 token transfer to recipientAddress of the specified amount
    const encodedData = createNoteInterface.encodeFunctionData(
      'createNote', [cid, hash, scw]
    )

    // You need to create transaction objects of the following interface
    const tx = {
      to: process.env.NEXT_PUBLIC_SHAKTI_CONTRACT, // destination smart contract address
      data: encodedData
    }


    const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_SENDER_PRIVATE_KEY, provider);

    // Optional: Transaction subscription. One can subscribe to various transaction states
    // Event listener that gets triggered once a hash is generetaed
    wallet.provider.on('txHashGenerated', (response) => {
      console.log('txHashGenerated event received via emitter', response);
    });
    wallet.provider.on('onHashChanged', (response) => {
      console.log('onHashChanged event received via emitter', response);
    });
    // Event listener that gets triggered once a transaction is mined
    wallet.provider.on('txMined', (response) => {
      console.log('txMined event received via emitter', response);
    });
    // Event listener that gets triggered on any error
    wallet.provider.on('error', (response) => {
      console.log('error event received via emitter', response);
    });
    // Sending gasless transaction
    const txResponse = await wallet.sendTransaction(tx);
    console.log('userOp hash', txResponse.hash);
    // If you do not subscribe to listener, one can also get the receipt like shown below 
    const txReciept = await txResponse.wait();
    console.log('Tx hash', txReciept.transactionHash);

    setIsLoading(false)
    fetchData()
    setNote('')
  }

  const encryptionSignature = async () => {
    const wallet = await loginProvider.getSigner();
    const address = await wallet.getAddress();
    const messageRequested = (await lighthouse.getAuthMessage(address)).data.message;
    const signedMessage = await wallet.signMessage(messageRequested);
    return ({
      signedMessage: signedMessage,
      publicKey: address
    });
  }

  const save = async () => {
    if (note.length < 3) return;

    setIsLoading(true)
    const sig = await encryptionSignature();
    const response = await lighthouse.textUploadEncrypted(
      note,
      process.env.NEXT_PUBLIC_LIGHTHOUSE_STORAGE,
      sig.publicKey,
      sig.signedMessage,
    );
    console.log(response.data.Hash);

    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(note));
    console.log(hash)
    const promises = [sendMessage(),
    sendTxOnChain(response.data.Hash, hash)]

    Promise.all(promises)
  }

  const sendMessage = async () => {
    try {
      const configuration = new Configuration({
        apiKey: process.env.NEXT_PUBLIC_CHATGPT,
      });

      const opena = new OpenAIApi(configuration);
      const response = await opena.createCompletion({
        model: "text-davinci-003",
        prompt: `read the note written by a female employee of a company: "${note}" + classify it to one of the categories of workplace harassment  as given under the POSH law of 2013, India, "The PoSH Act defines sexual harassment to include unwelcome acts such as physical contact and sexual advances, a demand or request for sexual favours, making sexually coloured remarks, showing pornography, and any other unwelcome physical, verbal, or non-verbal conduct of a sexual nature. It also lists down five circumstances that would constitute sexual harassment if they are connected to the above-mentioned acts- (i) Implied or explicit promise of preferential treatment in employment (ii) Implied or explicit threat of detrimental treatment in employment (iii) Implied or explicit threat about present or future employment status (iv) Interference with work or creating an intimidating or offensive or hostile work environment and (v) Humiliating treatment likely to affect health or safety." +  identify the scale (mild, medium, high risk) to which it matches with categories identified for the note and the kind of help the employee can seek.`,
        temperature: 0,
        max_tokens: 2000,
      });

      const reply = response.data.choices[0].text;
      setChatText(reply)
      openModal()
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <div className="w-full h-full flex-1">
    <div className="navbar bg-base-100 fixed flex w-screen top-0 left-0 px-10 z-10 box-shadow-10">
      <div className="flex-1 flex-row">
        <Image src={'/assets/shakti.png'} height={80} width={80} />
        <a className="btn btn-ghost normal-case text-xl">Shakti</a>
        <p>Built on Astar Network, Polkadot<br></br><span className="text-sm">Contract: <a className="text-primary" target="_blank" href={`https://shibuya.subscan.io/account/${process.env.NEXT_PUBLIC_SHAKTI_CONTRACT}?tab=contract`}>{process.env.NEXT_PUBLIC_SHAKTI_CONTRACT}</a></span></p>
      </div>
    </div>
    <div className="alert shadow-lg mt-16">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="fill-accent flex-shrink-0 w-6 h-6"><path xmlns="http://www.w3.org/2000/svg" d="M 15 3 C 11.686 3 9 5.686 9 9 L 9 10 C 9 13.314 11.686 16 15 16 C 18.314 16 21 13.314 21 10 L 21 9 C 21 5.686 18.314 3 15 3 z M 14.998047 19 C 10.992047 19 5.8520469 21.166844 4.3730469 23.089844 C 3.4590469 24.278844 4.329125 26 5.828125 26 L 24.169922 26 C 25.668922 26 26.539 24.278844 25.625 23.089844 C 24.146 21.167844 19.004047 19 14.998047 19 z"/></svg>
        <span>{scw}</span>
      </div>
      <div className="flex-none">
        <button onClick={logout} className="btn btn-sm btn-primary">Logout</button>
      </div>
    </div>

    <div className="mt-4">
      <div className="flex flex-col max-w-2xl">
        <h1 className="text-xl font-bold mb-2">Hi 👋🏼, Create a new note:</h1>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Hey, what happened? Feel free to share your experience." className="textarea textarea-bordered textarea-lg w-full max-w-xl" ></textarea>
        <button onClick={save} className={"btn btn-secondary w-min mt-2" + (isLoading ? " btn-disabled" : "")}>{isLoading ? "Loading..." : "Save"}</button>
      </div>

    </div>
    <div className="mt-6">
      <h1 className="text-xl font-bold mb-2">Past Experiences:</h1>
      <div className="w-full grid grid-rows-2 gap-4 grid-flow-row-dense ">
        {oldNotes.map((note, index) => {
          return <Card key={note.encryptedContentCID} index={index} loginProvider={loginProvider} provider={provider} note={note} />
        })}
      </div>
    </div>

    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
    >
      <div className="flex flex-row justify-between">
        <h2 className="font-bold text-xl">From Shakti: ⚡️</h2>
        <button onClick={closeModal}>X close</button>
      </div>
      <p>
        {chatText ?? ''}
      </p>
    </Modal>
  </div>
}

export default Dashboard
