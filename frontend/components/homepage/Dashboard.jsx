import { useEffect, useState } from "react";

import { ethers } from 'ethers'
import lighthouse from '@lighthouse-web3/sdk';
import contractABI from './abi.json'

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

const Dashboard = ({ logout, privateKey, account }) => {

  const [note, setNote] = useState('')
  const [oldNotes, setOldNotes] = useState([])
  const [chatText, setChatText] = useState()
  const [provider, setProvider] = useState()
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
      const result = await contract.getNotes({ from: scw }); // Replace 'methodName' with the actual method you want to call
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

  const sendTxOnChain = async (cid, hash) => { }

  const encryptionSignature = async () => {
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = scw;
    const messageRequested = (await lighthouse.getAuthMessage(address)).data.message;
    const signedMessage = await wallet.signMessage(messageRequested);
    return ({
      signedMessage: signedMessage,
      publicKey: address
    });
  }

  const save = async () => {
    if (note.length < 3) return;

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
    <div className="alert shadow-lg">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
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
        <button onClick={save} className="btn btn-secondary w-min mt-2">Save</button>
      </div>

    </div>
    <div className="mt-6">
      <h1 className="text-xl font-bold mb-2">Past Experiences:</h1>
      <div className="w-full grid grid-rows-2 gap-4 grid-flow-row-dense ">

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
