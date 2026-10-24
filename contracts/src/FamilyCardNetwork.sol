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

    // --- Pot and buckets ---

    /// @dev A limit or threshold of 0 means none. `held` is authorized but not
    /// yet settled; `held` and `spent` are written by card authorizations.
    struct Bucket {
        string name;
        uint256 perTxLimit;
        uint256 approvalThreshold;
        uint256 available;
        uint256 held;
        uint256 spent;
    }

    /// @dev One funder's transfer into one bucket. No attribution math is done
    /// on-chain; the backend derives first-in-first-out spending from events.
    struct Contribution {
        bytes32 funderId;
        uint256 bucketId;
        uint256 amount;
        uint256 timestamp;
    }

    /// @notice Number of buckets. Bucket IDs run from 1 to `bucketCount`;
    /// ID 0 means "no bucket".
    uint256 public bucketCount;
    /// @notice Number of contributions. Contribution IDs run from 1 to
    /// `contributionCount`.
    uint256 public contributionCount;

    mapping(uint256 bucketId => Bucket) private _buckets;
    mapping(uint256 contributionId => Contribution) private _contributions;

    event BucketCreated(
        uint256 indexed bucketId,
        string name,
        uint256 perTxLimit,
        uint256 approvalThreshold
    );
    event BucketLimitsUpdated(
        uint256 indexed bucketId,
        uint256 perTxLimit,
        uint256 approvalThreshold
    );
    event BucketFunded(
        uint256 indexed contributionId,
        bytes32 indexed funderId,
        uint256 indexed bucketId,
        uint256 amount
    );

    error NoLinkedBank(bytes32 userId);
    error ZeroAmount();
    error UnknownBucket(uint256 bucketId);
    error UnknownContribution(uint256 contributionId);
    error InsufficientBankBalance(bytes32 userId, uint256 balance, uint256 amount);

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

    /// @notice Creates an empty bucket in the family pot.
    /// @return bucketId The new bucket's ID (the first is 1).
    function createBucket(
        string calldata name,
        uint256 perTxLimit,
        uint256 approvalThreshold
    ) external onlyOwner returns (uint256 bucketId) {
        bucketId = ++bucketCount;
        Bucket storage bucket = _buckets[bucketId];
        bucket.name = name;
        bucket.perTxLimit = perTxLimit;
        bucket.approvalThreshold = approvalThreshold;

        emit BucketCreated(bucketId, name, perTxLimit, approvalThreshold);
    }

    /// @notice Replaces a bucket's per-purchase limit and approval threshold
    /// (0 means none).
    function setBucketLimits(
        uint256 bucketId,
        uint256 perTxLimit,
        uint256 approvalThreshold
    ) external onlyOwner {
        Bucket storage bucket = _existingBucket(bucketId);
        bucket.perTxLimit = perTxLimit;
        bucket.approvalThreshold = approvalThreshold;

        emit BucketLimitsUpdated(bucketId, perTxLimit, approvalThreshold);
    }

    /// @notice Moves money from a funder's bank balance into a bucket and
    /// records it as that funder's contribution. The tUSD stays in this
    /// contract; only the internal ledgers change.
    /// @return contributionId The new contribution's ID (the first is 1).
    function fundBucket(
        bytes32 funderId,
        uint256 bucketId,
        uint256 amount
    ) external onlyOwner returns (uint256 contributionId) {
        Bucket storage bucket = _existingBucket(bucketId);
        if (amount == 0) revert ZeroAmount();
        uint256 balance = _bankBalances[funderId];
        if (balance < amount) {
            revert InsufficientBankBalance(funderId, balance, amount);
        }

        _bankBalances[funderId] = balance - amount;
        bucket.available += amount;

        contributionId = ++contributionCount;
        _contributions[contributionId] = Contribution({
            funderId: funderId,
            bucketId: bucketId,
            amount: amount,
            timestamp: block.timestamp
        });

        emit BucketFunded(contributionId, funderId, bucketId, amount);
    }

    function getBucket(uint256 bucketId) external view returns (Bucket memory) {
        return _existingBucket(bucketId);
    }

    function getContribution(
        uint256 contributionId
    ) external view returns (Contribution memory) {
        if (contributionId == 0 || contributionId > contributionCount) {
            revert UnknownContribution(contributionId);
        }
        return _contributions[contributionId];
    }

    function _existingBucket(
        uint256 bucketId
    ) private view returns (Bucket storage) {
        if (bucketId == 0 || bucketId > bucketCount) {
            revert UnknownBucket(bucketId);
        }
        return _buckets[bucketId];
    }
}
