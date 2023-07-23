import { Web3AuthNoModal } from "@web3auth/no-modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { WALLET_ADAPTERS } from "@web3auth/base";

import { ethers } from 'ethers'
import { useEffect, useState } from "react";
import Image from "next/image";
import Dashboard from "./Dashboard";

const HomePage = () => {
  const [account, setAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [web3Auth, setWeb3Auth] = useState()
  const [loginProvider, setLoginProvider] = useState()

  const checkLogin = async () => {
    if (!web3Auth) return -1;
    // create a provider from the social login provider that 
    // will be used by the smart account package of the Biconomy SDK
    const provider = new ethers.providers.Web3Provider(
      web3Auth.provider,
    );

    // get list of accounts available with the provider
    const accounts = await provider.listAccounts();
    if (accounts.length == 0) return -1;

    setLoginProvider(provider)
    setAccount(accounts[0])
    setLoading(false)
  }

  const initSocial = async () => {
    const chainConfig = {
      chainNamespace: "eip155",
      chainId: "0x1",
      rpcTarget: "https://rpc.ankr.com/eth",
      displayName: "Ethereum Mainnet",
      blockExplorer: "https://goerli.etherscan.io",
      ticker: "ETH",
      tickerName: "Ethereum",
    };
    const web3auth = new Web3AuthNoModal({
      clientId: process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID, // Get your Client ID from Web3Auth Dashboard
      chainConfig,
    });

    setWeb3Auth(web3auth)
    const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

    const openloginAdapter = new OpenloginAdapter({
      privateKeyProvider,
    });
    web3auth.configureAdapter(openloginAdapter);
    await web3auth.init();
  }

  useEffect(() => {
    setLoading(true)
    initSocial().then(() => {
      setLoading(false)
    })
  }, [])

  const openSocialSignon = async () => {
    const rep = await checkLogin()
    if (rep != -1) return;

    await web3Auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      loginProvider: "google",
    });
    setLoading(true)
    checkLogin()
  }

  const logout = async () => {
    await web3Auth.logout()

    await initSocial()
    setAccount('')
  }

  if (loading)
    return <>
      <Image src={'/assets/shakti.png'} height={100} width={100} />
      <h3>Loading Shakti...</h3>
    </>


  if (account == '')
    return <>
      <Image src={'/assets/shakti.png'} height={100} width={100} />
      <h3 className="mb-2 font-bold text-2xl">Hi, I am Shakti ⚡️</h3>
      <div className="btn btn-active btn-secondary" onClick={openSocialSignon}>Sign In</div>
    </>

  return <Dashboard account={account} loginProvider={loginProvider} logout={logout} />
}

export default HomePage
