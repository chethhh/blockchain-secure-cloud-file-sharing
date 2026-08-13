// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FileSharing
 * @dev Manages file ownership, IPFS CIDs, and access control on Ethereum blockchain.
 */
contract FileSharing {
    struct File {
        uint256 id;
        string ipfsHash;
        address owner;
        uint256 createdAt;
        bool exists;
    }

    uint256 public fileCount;
    
    // Mapping from File ID to File struct
    mapping(uint256 => File) public files;

    // Mapping from File ID to User Address to Access Permission (bool)
    mapping(uint256 => mapping(address => bool)) public fileAccess;

    // Events
    event FileUploaded(
        uint256 indexed fileId,
        string ipfsHash,
        address indexed owner,
        uint256 timestamp
    );
    event AccessGranted(
        uint256 indexed fileId,
        address indexed owner,
        address indexed recipient
    );
    event AccessRevoked(
        uint256 indexed fileId,
        address indexed owner,
        address indexed recipient
    );

    // Modifiers
    modifier fileExists(uint256 _fileId) {
        require(files[_fileId].exists, "FileSharing: File does not exist");
        _;
    }

    modifier onlyFileOwner(uint256 _fileId) {
        require(files[_fileId].exists, "FileSharing: File does not exist");
        require(files[_fileId].owner == msg.sender, "FileSharing: Only file owner can perform this action");
        _;
    }

    /**
     * @dev Uploads an encrypted file reference (IPFS CID) to the blockchain.
     * @param _ipfsHash The IPFS CID returned from Pinata upload.
     * @return fileId The unique ID assigned to the file.
     */
    function uploadFile(string memory _ipfsHash) external returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "FileSharing: IPFS hash cannot be empty");

        fileCount++;
        uint256 newFileId = fileCount;

        files[newFileId] = File({
            id: newFileId,
            ipfsHash: _ipfsHash,
            owner: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        // Owner automatically has access to their own file
        fileAccess[newFileId][msg.sender] = true;

        emit FileUploaded(newFileId, _ipfsHash, msg.sender, block.timestamp);
        return newFileId;
    }

    /**
     * @dev Grants access permission to a specific Ethereum wallet address for a file.
     * @param _user Target wallet address to grant access.
     * @param _fileId File ID for which permission is granted.
     */
    function grantAccess(address _user, uint256 _fileId) external onlyFileOwner(_fileId) {
        require(_user != address(0), "FileSharing: Invalid user address");
        require(_user != msg.sender, "FileSharing: Owner already has access");

        fileAccess[_fileId][_user] = true;
        emit AccessGranted(_fileId, msg.sender, _user);
    }

    /**
     * @dev Revokes access permission from a specific Ethereum wallet address for a file.
     * @param _user Target wallet address to revoke access.
     * @param _fileId File ID for which permission is revoked.
     */
    function revokeAccess(address _user, uint256 _fileId) external onlyFileOwner(_fileId) {
        require(_user != address(0), "FileSharing: Invalid user address");
        require(_user != msg.sender, "FileSharing: Owner cannot revoke own access");

        fileAccess[_fileId][_user] = false;
        emit AccessRevoked(_fileId, msg.sender, _user);
    }

    /**
     * @dev Gets file metadata and ownership details.
     * @param _fileId The ID of the requested file.
     */
    function getFileDetails(uint256 _fileId) external view fileExists(_fileId) returns (
        string memory ipfsHash,
        address owner,
        uint256 createdAt,
        bool exists
    ) {
        File memory f = files[_fileId];
        return (f.ipfsHash, f.owner, f.createdAt, f.exists);
    }

    /**
     * @dev Checks if a specific wallet address has permission to access a file.
     * @param _user The address to check.
     * @param _fileId The ID of the file.
     */
    function hasAccess(address _user, uint256 _fileId) external view fileExists(_fileId) returns (bool) {
        if (files[_fileId].owner == _user) {
            return true;
        }
        return fileAccess[_fileId][_user];
    }
}
