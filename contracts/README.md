# Shakti Contract

Shakti contract is a smart contract written in Solidity and Deployed on Shibuya Testnet of Astar, Polkadot.

The contract aims to store notes written by users, the structure of each note is as follows:

```solidity
  // Structure of the note.
  struct Note {
      // Encrypted Content CID value from IPFS.
      string encryptedContentCID;

      // Hash of Original Note represents the hash of data before encryption.
      // This will be used verify that the exact same content was made public on IPFS in future
      // so, verification will be, hashOfOriginalNote == hash of unencryptedContentCID's data.
      string hashOfOriginalNote;

      // Unencrypted Content CID value from IPFS.
      string unencryptedContentCID;
  }
```

## Flow:

- The note is initally stored encrypted in the IPFS.
- The CID of encrypted note, along with the hash of the orignal note is saved in the contract.
- Hash of the original note stored in contract state, enables us to check the originality of note when it will be uploaded in unencrypted format.

- After saving note, user can make it public anytime they want to by fetching encrypted note on client from IPFS & uploading it back unencrypted. 
- The Hash of newly uploaded unencrypted note is matched with hash of original note stored in contract state to check correctness.


## Contract 

Address: 0x89b2F84bd0d79c285577e323B330B41C2c940608
Link: https://shibuya.subscan.io/account/0x89b2F84bd0d79c285577e323B330B41C2c940608?tab=contract