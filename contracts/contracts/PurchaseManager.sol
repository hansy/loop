// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./VideoNFT.sol";
import "./PurchaseManagerStorage.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

interface IVideoNFT {
    function getPrice(uint256 tokenId) external view returns (uint256);
    function getCreator(uint256 tokenId) external view returns (address);
}

interface IPurchaseManagerStorage {
    function setPurchase(
        uint256 tokenId,
        address purchaser,
        bool value
    ) external;
    function getPurchase(
        uint256 tokenId,
        address purchaser
    ) external view returns (bool);
}

contract PurchaseManager {
    IVideoNFT public immutable videoNFTContract;
    IPurchaseManagerStorage public immutable pmStorage;
    ERC20Permit public immutable usdcTokenContract;

    event VideoPurchased(uint256 indexed tokenId, address indexed purchaser);

    constructor(
        address _videoNFTContract,
        address _usdcTokenContract,
        address _pmStorageContract
    ) {
        videoNFTContract = IVideoNFT(_videoNFTContract);
        usdcTokenContract = ERC20Permit(_usdcTokenContract);
        pmStorage = IPurchaseManagerStorage(_pmStorageContract);
    }

    function _hasPurchasedVideo(
        uint256 tokenId,
        address purchaser
    ) private view returns (bool) {
        return pmStorage.getPurchase(tokenId, purchaser);
    }

    function purchaseVideoWithPermit(
        uint256 tokenId,
        address originalSender,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        uint256 videoPriceInUSDCwei = videoNFTContract.getPrice(tokenId);
        address videoOwner = videoNFTContract.getCreator(tokenId);

        require(videoOwner != address(0), "Invalid video owner");
        require(
            !_hasPurchasedVideo(tokenId, originalSender),
            "Already purchased"
        );

        usdcTokenContract.permit(
            originalSender,
            address(this),
            videoPriceInUSDCwei,
            deadline,
            v,
            r,
            s
        );

        require(
            usdcTokenContract.transferFrom(
                originalSender,
                videoOwner,
                videoPriceInUSDCwei
            ),
            "USDC transfer failed"
        );

        pmStorage.setPurchase(tokenId, originalSender, true);

        emit VideoPurchased(tokenId, originalSender);
    }

    function hasPurchasedVideo(
        uint256 tokenId,
        address purchaser
    ) external view returns (bool) {
        return _hasPurchasedVideo(tokenId, purchaser);
    }
}
