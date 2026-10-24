// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {MockUSD} from "../../src/MockUSD.sol";

/// @dev Test-only stand-in for a contract minter such as the card network.
contract MintCaller {
    function mint(MockUSD token, address to, uint256 amount) external {
        token.mint(to, amount);
    }
}
