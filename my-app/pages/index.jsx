import Head from 'next/head';
import Image from "next/image";
import { useEffect, useState, useRef } from 'react';
import Web3Modal from "web3modal";
import styles from '../styles/Home.module.css';
import { BigNumber, Contract, providers, utils } from "ethers";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

export default function Home() {
  // Create a BigNumber `0`
  const zero = BigNumber.from(0);

  // checks if the user wallet is connected
  const [walletConnected, setWalletConnected] = useState(false);

  // Create a reference to the Web3 Modal used for connecting to Metamask
  const web3ModalRef = useRef();

  // it keeps track of the total number of tokens that have been minted till now out of 10000(max total supply)
  const [tokensMinted, setTokensMinted] = useState(zero);

  // it keeps track of the crypto dev tokens owned by the address
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);

  // amount of the tokens that the user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);

  const [loading, setLoading] = useState(false);

  // tokens that has not yet been claimed by the user
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);

  const [isOwner, setIsOwner] = useState(false);

  // A `Provider` is needed to interact {reading only} with the blockchain
  // A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain.
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const {chainId} = await web3Provider.getNetwork();

    if(chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change the network to Goerli");
    }

    if(needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true)
    } catch (error) {
      console.error(error);
    }
  }



  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setBalanceOfCryptoDevTokens(balance);

    } catch (error) {
      console.error(error);
    }
  }



  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address); 

      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        var amount = 0;
        for(var i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (error) {
      console.error(error);
      setTokensToBeClaimed(zero);
    }
  }




  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);

    } catch (error) {
      console.error(error);
    }
  }




  const mintCryptoDevToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI,signer);

      const value = 0.001*amount;

      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });

      // while waiting for the tx
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You have successfully minted Crypto Dev Token");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();

    } catch (error) {
      console.error(error)
    }
  }



  const claimCryptoDevTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI,signer);
      const tx = await tokenContract.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You have successfully claimed Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error);
    }
  }


  // getOwner: gets the contract owner by connected address
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);

      // call the owner function from the contract
      const _owner = await tokenContract.owner();

      // we get signer to extract address of currently connected Metamask account
      const signer = await getProviderOrSigner(true);

      // Get the address associated to signer which is connected to Metamask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message)
    }
  }


  // withdrawCoins: withdraws ether and tokens by calling the withdraw function in the contract
  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI,signer);

      const tx = await tokenAmount.Contract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
    } catch (err) {
      console.error(err)
    }
  }



  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // if owner is connected, withdrawCoins() is called
    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button1} onClick={withdrawCoins}>
            Withdraw Coins
          </button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // show the mint button if the user does not have any tokens to claim
    return (
    <div style={{ display: "flex-col" }}>
      <div>
        <input type="number" placeholder="Amount of Tokens" onChange={(e) => setTokenAmount(BigNumber.from(e.target.value)) } />
      </div> <br />
      <div>
        <button className={styles.button} disabled={!(tokenAmount > 0)} onClick={() => mintCryptoDevToken(tokenAmount)}>
          Mint Tokens
        </button>
      </div>
    </div>
    );
  };



  useEffect(() => {
    if(!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);



  return (
    <div>
      <Head>
        <title> Crypto Devs ICO </title>
        <meta name="description" content="ICO-dApp" />
        <link rel="icon" href="./favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}> Welcome to Crypto Devs ICO </h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev Tokens here
          </div>
          {walletConnected ? (
              <div>
                <div className={styles.description}>
                  You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto Dev Tokens
                </div>
                <div className={styles.description}>
                  Overall {utils.formatEther(tokensMinted)} /10000 have been minted
                </div>
                {renderButton()}
              </div>
            ) : (
              <button onClick={connectWallet} className={styles.button}>
                Connect your wallet
              </button>
            )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Elo
      </footer>
    </div>
  );
}
