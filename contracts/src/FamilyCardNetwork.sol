// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MockUSD} from "./MockUSD.sol";

/// @title FamilyCardNetwork
/// @notice Simulated bank, card issuer and card network for one family.
/// @dev One family per deployment. The owner is the operator (the deployer
/// wallet, i.e. the backend); only it can call write functions, acting for
/// users identified by `bytes32` IDs. The network holds every tUSD it mints
/// and keeps internal ledgers. Amounts are in cents (tUSD has 2 decimals).
contract FamilyCardNetwork is Ownable {
    MockUSD public immutable tusd;

    // --- Simulated bank (stands in for Plaid + ACH) ---

    mapping(bytes32 userId => bool) public hasLinkedBank;
    mapping(bytes32 userId => uint256) private _bankBalances;

    event BankLinked(bytes32 indexed userId, string bankName, string last4);
    event BankDeposit(bytes32 indexed userId, uint256 amount, uint256 newBalance);

    error NoLinkedBank(bytes32 userId);
    error ZeroAmount();

    constructor(MockUSD token) Ownable(msg.sender) {
        tusd = token;
    }

    /// @notice Links a bank account to a user. A user may link several banks;
    /// on-chain their money sits in one bank balance.
    function linkBankAccount(
        bytes32 userId,
        string calldata bankName,
        string calldata last4
    ) external onlyOwner {
        hasLinkedBank[userId] = true;
        emit BankLinked(userId, bankName, last4);
    }

    /// @notice Simulated ACH deposit: mints tUSD to this contract and credits
    /// the user's bank balance.
    function bankDeposit(bytes32 userId, uint256 amount) external onlyOwner {
        if (!hasLinkedBank[userId]) revert NoLinkedBank(userId);
        if (amount == 0) revert ZeroAmount();

        uint256 newBalance = _bankBalances[userId] + amount;
        _bankBalances[userId] = newBalance;
        tusd.mint(address(this), amount);

        emit BankDeposit(userId, amount, newBalance);
    }

    function bankBalanceOf(bytes32 userId) external view returns (uint256) {
        return _bankBalances[userId];
    }
}
