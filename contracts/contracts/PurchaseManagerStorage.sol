// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PurchaseManagerStorage is Ownable {
    address public manager;

    // map of video tokenId to map of purchaser address to bool
    mapping(uint256 => mapping(address => bool)) internal purchases;

    constructor(address _owner) Ownable(_owner) {}

    // modifier to check if caller is manager or owner
    modifier onlyManagerOrOwner() {
        require(
            msg.sender == manager || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    function setManager(address _manager) external onlyOwner {
        manager = _manager;
    }

    function setPurchase(
        uint256 tokenId,
        address purchaser,
        bool value
    ) external onlyManagerOrOwner {
        purchases[tokenId][purchaser] = value;
    }

    function getPurchase(
        uint256 tokenId,
        address purchaser
    ) external view onlyManagerOrOwner returns (bool) {
        return purchases[tokenId][purchaser];
    }
}
