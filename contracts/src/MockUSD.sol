// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockUSD
/// @notice Simulated testnet dollars ("Test USD", tUSD). 1 unit = 1 cent.
/// @dev The owner is the operator (the deployer wallet). Only the operator and
/// contracts it authorizes (the card network, whose own operator-gated bank
/// deposit path mints) can mint. Wallets can never be authorized as minters.
contract MockUSD is ERC20, Ownable {
    mapping(address account => bool) public isMinter;

    event MinterSet(address indexed account, bool allowed);

    error NotMinter(address account);
    error MinterNotContract(address account);

    constructor() ERC20("Test USD", "tUSD") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return 2;
    }

    function setMinter(address account, bool allowed) external onlyOwner {
        if (allowed && account.code.length == 0) {
            revert MinterNotContract(account);
        }
        isMinter[account] = allowed;
        emit MinterSet(account, allowed);
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != owner() && !isMinter[msg.sender]) {
            revert NotMinter(msg.sender);
        }
        _mint(to, amount);
    }
}
