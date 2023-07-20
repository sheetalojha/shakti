//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

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

contract Shakti {
    address private owner;

    event NewNote(Note note, address sender, uint256 index);

    event PublicNote(Note note, address sender, uint256 index);

    mapping(address => Note[]) private addressToPrivateNotes;

    constructor() {
        owner = msg.sender;
    }

    function getNotes(address user) public view returns (Note[] memory) {
        require(
            addressToPrivateNotes[user].length > 0,
            "User don't have any notes"
        );

        return addressToPrivateNotes[user];
    }

    function getNote(
        uint256 index,
        address user
    ) public view returns (Note memory) {
        require(
            addressToPrivateNotes[user].length > index,
            "User don't have note at index."
        );

        return addressToPrivateNotes[user][index];
    }

    function createNote(
        string calldata encryptedContentCID,
        string calldata hashOfOriginalNote,
        address user
    ) external {
        require(msg.sender == owner, "Sender must be contract owner");
        Note memory newNote = Note(encryptedContentCID, hashOfOriginalNote, "");

        addressToPrivateNotes[user].push(newNote);

        emit NewNote(newNote, user, addressToPrivateNotes[user].length - 1);
    }

    function makeNotePublic(
        uint256 index,
        string memory unencryptedContentCID,
        address user
    ) public {
        require(msg.sender == owner, "Sender must be contract owner");
        require(
            addressToPrivateNotes[user].length > index,
            "User don't have note at index."
        );

        addressToPrivateNotes[user][index]
            .unencryptedContentCID = unencryptedContentCID;

        emit PublicNote(addressToPrivateNotes[user][index], user, index);
    }
}
