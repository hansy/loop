// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract VideoNFT is Initializable, ERC1155Upgradeable, OwnableUpgradeable {
    struct Video {
        string metadataCID;
        uint256 price; // Price in USDC wei
        address creator;
    }

    // Mapping from token ID to Video struct
    mapping(uint256 => Video) public videos;

    uint256 private tokenIdCounter;

    event VideoCreated(
        uint256 tokenId,
        address creator,
        uint256 price,
        string metadataCID
    );
    event VideoMetadataUpdated(uint256 tokenId, string newVideoMetadataCID);
    event VideoPriceUpdated(uint256 tokenId, uint256 newVideoPrice);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner,
        uint256 initialCounter
    ) public initializer {
        __ERC1155_init("");
        __Ownable_init(initialOwner);
        tokenIdCounter = initialCounter;
    }

    modifier tokenExists(uint256 tokenId) {
        require(tokenId < tokenIdCounter, "Token ID does not exist");
        _;
    }

    // Returns current value of tokenIdCounter, then increments it by 1
    function autoGenerateTokenId() internal returns (uint256) {
        tokenIdCounter++;
        return tokenIdCounter - 1; // Return the current tokenId
    }

    function _isVideoOwner(
        uint256 tokenId,
        address user
    ) internal view returns (bool) {
        return videos[tokenId].creator == user;
    }

    function mintVideoNFT(
        address creator,
        string memory metadataCID,
        uint256 priceInUSDCwei
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = autoGenerateTokenId();
        _mint(creator, tokenId, 1, "");
        videos[tokenId] = Video(metadataCID, priceInUSDCwei, creator);

        emit VideoCreated(tokenId, creator, priceInUSDCwei, metadataCID);

        return tokenId;
    }

    function updateMetadataCID(
        uint256 tokenId,
        string memory newVideoMetadataCID
    ) public tokenExists(tokenId) {
        require(
            _isVideoOwner(tokenId, msg.sender) || owner() == msg.sender,
            "Only video owner or contract owner can update metadata"
        );
        videos[tokenId].metadataCID = newVideoMetadataCID;

        emit VideoMetadataUpdated(tokenId, newVideoMetadataCID);
    }

    function updatePrice(
        uint256 tokenId,
        uint256 newPriceInUSDCwei
    ) public tokenExists(tokenId) {
        require(
            owner() == msg.sender || _isVideoOwner(tokenId, msg.sender),
            "Only video owner or contract owner can update price"
        );
        videos[tokenId].price = newPriceInUSDCwei;

        emit VideoPriceUpdated(tokenId, newPriceInUSDCwei);
    }

    function uri(
        uint256 tokenId
    ) public view override tokenExists(tokenId) returns (string memory) {
        return string(abi.encodePacked("ipfs://", videos[tokenId].metadataCID));
    }

    function getPrice(
        uint256 tokenId
    ) public view tokenExists(tokenId) returns (uint256) {
        return videos[tokenId].price;
    }

    function getCreator(
        uint256 tokenId
    ) public view tokenExists(tokenId) returns (address) {
        return videos[tokenId].creator;
    }
}
