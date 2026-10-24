// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
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
    /// yet settled; `held` and `spent` are written by `authorize` and
    /// `capture`, so available + held + spent is everything funded.
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

    // --- Simulated card issuing (stands in for Stripe Issuing cards) ---

    /// @dev Issued → Active (the dependent accepts the card) ⇄ Frozen.
    enum CardStatus {
        Issued,
        Active,
        Frozen
    }

    struct Card {
        bytes32 dependentId;
        string last4;
        uint8 expiryMonth;
        uint16 expiryYear;
        CardStatus status;
    }

    /// @notice Number of cards. Card IDs run from 1 to `cardCount`.
    uint256 public cardCount;

    mapping(uint256 cardId => Card) private _cards;
    /// @dev Keyed by the hash of the plain lowercase category name.
    mapping(bytes32 categoryKey => bool) private _blockedCategories;

    event CardIssued(
        uint256 indexed cardId,
        bytes32 indexed dependentId,
        string last4,
        uint8 expiryMonth,
        uint16 expiryYear
    );
    event CardActivated(uint256 indexed cardId);
    event CardFrozen(uint256 indexed cardId);
    event CardUnfrozen(uint256 indexed cardId);
    event CategoryBlocked(string category, bool blocked);

    // --- Simulated merchants (stands in for card-network merchant data) ---

    struct Merchant {
        string name;
        uint16 mcc;
        string category;
        address payoutAddress;
    }

    mapping(bytes32 merchantId => Merchant) private _merchants;
    mapping(bytes32 merchantId => bool) public isMerchantRegistered;

    event MerchantRegistered(
        bytes32 indexed merchantId,
        string name,
        uint16 mcc,
        string category,
        address payoutAddress
    );

    // --- Authorizations (stands in for Stripe's real-time authorizations) ---

    /// @dev Mirrors card-network decline reasons.
    enum ReasonCode {
        Approved,
        BlockedCategory,
        InsufficientFunds,
        OverLimit,
        CardInactive,
        NeedsApproval,
        OutsideHours
    }

    enum AuthStatus {
        Approved,
        Declined,
        Pending,
        ParentApproved,
        ParentDeclined,
        Captured
    }

    /// @dev The backend decision engine's verdict, passed into `authorize`.
    enum EngineDecision {
        Approve,
        Pending,
        Reject
    }

    /// @dev `bucketId` 0 means no bucket (allowed only for pending or reject).
    struct Authorization {
        uint256 cardId;
        bytes32 merchantId;
        uint256 bucketId;
        uint256 amount;
        AuthStatus status;
        ReasonCode reasonCode;
        string reason;
        uint256 timestamp;
    }

    /// @dev A parent's single-use permission for one card at one merchant.
    /// Valid while `block.timestamp < expiresAt` and the amount is at most
    /// `maxAmount`. `expiresAt` 0 means no pass.
    struct TempPass {
        uint256 maxAmount;
        uint256 expiresAt;
    }

    /// @notice Number of authorizations. Authorization IDs run from 1 to
    /// `authorizationCount`.
    uint256 public authorizationCount;

    mapping(uint256 authId => Authorization) private _authorizations;
    mapping(uint256 cardId => mapping(bytes32 merchantId => TempPass))
        private _tempPasses;

    event AuthorizationCreated(
        uint256 indexed authId,
        uint256 indexed cardId,
        bytes32 indexed merchantId,
        uint256 bucketId,
        uint256 amount,
        AuthStatus status,
        ReasonCode reasonCode,
        string reason
    );
    event AuthorizationCaptured(
        uint256 indexed authId,
        bytes32 indexed merchantId,
        address indexed payoutAddress,
        uint256 amount
    );
    event AuthorizationResolved(
        uint256 indexed authId,
        bytes32 indexed parentId,
        bool approved,
        AuthStatus status
    );
    event TempPassGranted(
        uint256 indexed cardId,
        bytes32 indexed merchantId,
        uint256 maxAmount,
        uint256 expiresAt
    );

    error NoLinkedBank(bytes32 userId);
    error ZeroAmount();
    error UnknownBucket(uint256 bucketId);
    error UnknownContribution(uint256 contributionId);
    error InsufficientBankBalance(bytes32 userId, uint256 balance, uint256 amount);
    error InvalidExpiryMonth(uint8 expiryMonth);
    error UnknownCard(uint256 cardId);
    error InvalidCardStatus(uint256 cardId, CardStatus status);
    error InvalidCategory(string category);
    error ZeroAddress();
    error MerchantAlreadyRegistered(bytes32 merchantId);
    error UnknownMerchant(bytes32 merchantId);
    error BucketRequired();
    error EngineCodeMismatch(EngineDecision engineDecision, ReasonCode reasonCode);
    error UnknownAuthorization(uint256 authId);
    error InvalidAuthorizationStatus(uint256 authId, AuthStatus status);
    error PassAlreadyExpired(uint256 expiresAt);

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

    // --- Cards ---

    /// @notice Issues a card to a dependent. It must be activated before use.
    /// @return cardId The new card's ID (the first is 1).
    function issueCard(
        bytes32 dependentId,
        string calldata last4,
        uint8 expiryMonth,
        uint16 expiryYear
    ) external onlyOwner returns (uint256 cardId) {
        if (expiryMonth == 0 || expiryMonth > 12) {
            revert InvalidExpiryMonth(expiryMonth);
        }
        cardId = ++cardCount;
        _cards[cardId] = Card({
            dependentId: dependentId,
            last4: last4,
            expiryMonth: expiryMonth,
            expiryYear: expiryYear,
            status: CardStatus.Issued
        });

        emit CardIssued(cardId, dependentId, last4, expiryMonth, expiryYear);
    }

    /// @notice The dependent accepted the card: Issued → Active.
    function activateCard(uint256 cardId) external onlyOwner {
        _moveCard(cardId, CardStatus.Issued, CardStatus.Active);
        emit CardActivated(cardId);
    }

    /// @notice Parent control: Active → Frozen.
    function freezeCard(uint256 cardId) external onlyOwner {
        _moveCard(cardId, CardStatus.Active, CardStatus.Frozen);
        emit CardFrozen(cardId);
    }

    /// @notice Parent control: Frozen → Active.
    function unfreezeCard(uint256 cardId) external onlyOwner {
        _moveCard(cardId, CardStatus.Frozen, CardStatus.Active);
        emit CardUnfrozen(cardId);
    }

    function getCard(uint256 cardId) external view returns (Card memory) {
        return _existingCard(cardId);
    }

    /// @notice Blocks or unblocks a merchant category for every card, e.g.
    /// "bar". Categories are plain lowercase names, as on merchants.
    function setBlockedCategory(
        string calldata category,
        bool blocked
    ) external onlyOwner {
        _blockedCategories[_categoryKey(category)] = blocked;
        emit CategoryBlocked(category, blocked);
    }

    function isCategoryBlocked(
        string calldata category
    ) external view returns (bool) {
        return _blockedCategories[_categoryKey(category)];
    }

    // --- Merchants ---

    /// @notice Registers a merchant. `category` is a plain lowercase name
    /// (e.g. "grocery"); captured purchases are paid to `payoutAddress`.
    function registerMerchant(
        bytes32 merchantId,
        string calldata name,
        uint16 mcc,
        string calldata category,
        address payoutAddress
    ) external onlyOwner {
        if (isMerchantRegistered[merchantId]) {
            revert MerchantAlreadyRegistered(merchantId);
        }
        _categoryKey(category);
        if (payoutAddress == address(0)) revert ZeroAddress();

        isMerchantRegistered[merchantId] = true;
        _merchants[merchantId] = Merchant({
            name: name,
            mcc: mcc,
            category: category,
            payoutAddress: payoutAddress
        });

        emit MerchantRegistered(merchantId, name, mcc, category, payoutAddress);
    }

    function getMerchant(
        bytes32 merchantId
    ) external view returns (Merchant memory) {
        return _existingMerchant(merchantId);
    }

    // --- Authorizations ---

    /// @notice Records a card authorization. The backend engine decides
    /// first; the chain then re-checks its hard rules (defense in depth) and
    /// the first failing check decides:
    ///   1. card not Active                     → Declined, card_inactive
    ///   2. merchant category blocked           → Declined, blocked_category
    ///   3. with a bucket: amount > available   → Declined, insufficient_funds
    ///                     amount > perTxLimit  → Declined, over_limit
    ///   4. engine says reject                  → Declined, engine's code
    ///   5. engine says pending                 → Pending, engine's code (no hold)
    ///   6. amount > approvalThreshold and no
    ///      valid temporary pass                → Pending, needs_approval
    ///   7. otherwise                           → Approved: available → held,
    ///      and any matching temporary pass is used up.
    /// When the chain's outcome differs from the engine's, the chain's code is
    /// stored with an "Enforced on-chain" reason instead of the engine's.
    /// @param bucketId The bucket the backend charged; 0 (none) is allowed
    /// only when the engine says pending or reject.
    /// @return authId The new authorization's ID (the first is 1).
    function authorize(
        uint256 cardId,
        bytes32 merchantId,
        uint256 bucketId,
        uint256 amount,
        EngineDecision engineDecision,
        ReasonCode reasonCode,
        string calldata reason
    ) external onlyOwner returns (uint256 authId) {
        _checkAuthorizationInputs(
            cardId,
            merchantId,
            bucketId,
            amount,
            engineDecision,
            reasonCode
        );
        (AuthStatus status, ReasonCode code, bool passValid) = _evaluate(
            cardId,
            merchantId,
            bucketId,
            amount,
            engineDecision,
            reasonCode
        );

        authId = ++authorizationCount;
        Authorization storage auth = _authorizations[authId];
        auth.cardId = cardId;
        auth.merchantId = merchantId;
        auth.bucketId = bucketId;
        auth.amount = amount;
        auth.status = status;
        auth.reasonCode = code;
        auth.timestamp = block.timestamp;
        if (status == _engineStatus(engineDecision) && code == reasonCode) {
            auth.reason = reason;
        } else {
            auth.reason = _onChainReason(code);
        }

        if (status == AuthStatus.Approved) {
            Bucket storage bucket = _buckets[bucketId];
            bucket.available -= amount;
            bucket.held += amount;
            if (passValid) delete _tempPasses[cardId][merchantId];
        }

        _emitAuthorizationCreated(authId, auth);
    }

    /// @notice Settles an approved authorization: held → spent, and the tUSD
    /// is paid to the merchant's payout address.
    function capture(uint256 authId) external onlyOwner {
        Authorization storage auth = _authorizationWithStatus(
            authId,
            AuthStatus.Approved
        );
        uint256 amount = auth.amount;
        auth.status = AuthStatus.Captured;

        Bucket storage bucket = _buckets[auth.bucketId];
        bucket.held -= amount;
        bucket.spent += amount;

        address payoutAddress = _merchants[auth.merchantId].payoutAddress;
        SafeERC20.safeTransfer(tusd, payoutAddress, amount);

        emit AuthorizationCaptured(
            authId,
            auth.merchantId,
            payoutAddress,
            amount
        );
    }

    /// @notice Records a parent's answer to a pending authorization. No money
    /// moves; on approval the backend grants a temporary pass and retries
    /// with a new authorization.
    function resolvePending(
        uint256 authId,
        bool approved,
        bytes32 parentId
    ) external onlyOwner {
        Authorization storage auth = _authorizationWithStatus(
            authId,
            AuthStatus.Pending
        );
        AuthStatus status = approved
            ? AuthStatus.ParentApproved
            : AuthStatus.ParentDeclined;
        auth.status = status;

        emit AuthorizationResolved(authId, parentId, approved, status);
    }

    /// @notice Lets one card make one purchase of at most `maxAmount` at one
    /// merchant above the bucket's approval threshold, until `expiresAt`.
    /// Replaces any earlier pass for the same card and merchant.
    function grantTemporaryPass(
        uint256 cardId,
        bytes32 merchantId,
        uint256 maxAmount,
        uint256 expiresAt
    ) external onlyOwner {
        _existingCard(cardId);
        _existingMerchant(merchantId);
        if (maxAmount == 0) revert ZeroAmount();
        if (expiresAt <= block.timestamp) revert PassAlreadyExpired(expiresAt);

        _tempPasses[cardId][merchantId] = TempPass({
            maxAmount: maxAmount,
            expiresAt: expiresAt
        });

        emit TempPassGranted(cardId, merchantId, maxAmount, expiresAt);
    }

    function getAuthorization(
        uint256 authId
    ) external view returns (Authorization memory) {
        return _existingAuthorization(authId);
    }

    // --- Private helpers ---

    function _existingCard(
        uint256 cardId
    ) private view returns (Card storage) {
        if (cardId == 0 || cardId > cardCount) revert UnknownCard(cardId);
        return _cards[cardId];
    }

    function _moveCard(
        uint256 cardId,
        CardStatus from,
        CardStatus to
    ) private {
        Card storage card = _existingCard(cardId);
        if (card.status != from) revert InvalidCardStatus(cardId, card.status);
        card.status = to;
    }

    /// @dev Reverts unless `category` is non-empty with no uppercase ASCII
    /// letters, so "Bar" can never slip past a block on "bar".
    function _categoryKey(
        string calldata category
    ) private pure returns (bytes32) {
        bytes calldata raw = bytes(category);
        if (raw.length == 0) revert InvalidCategory(category);
        for (uint256 i = 0; i < raw.length; ++i) {
            if (raw[i] >= "A" && raw[i] <= "Z") revert InvalidCategory(category);
        }
        return keccak256(raw);
    }

    function _existingMerchant(
        bytes32 merchantId
    ) private view returns (Merchant storage) {
        if (!isMerchantRegistered[merchantId]) {
            revert UnknownMerchant(merchantId);
        }
        return _merchants[merchantId];
    }

    function _existingAuthorization(
        uint256 authId
    ) private view returns (Authorization storage) {
        if (authId == 0 || authId > authorizationCount) {
            revert UnknownAuthorization(authId);
        }
        return _authorizations[authId];
    }

    function _authorizationWithStatus(
        uint256 authId,
        AuthStatus expected
    ) private view returns (Authorization storage auth) {
        auth = _existingAuthorization(authId);
        if (auth.status != expected) {
            revert InvalidAuthorizationStatus(authId, auth.status);
        }
    }

    /// @dev Reverts on calls that are malformed rather than declinable.
    function _checkAuthorizationInputs(
        uint256 cardId,
        bytes32 merchantId,
        uint256 bucketId,
        uint256 amount,
        EngineDecision engineDecision,
        ReasonCode reasonCode
    ) private view {
        _existingCard(cardId);
        _existingMerchant(merchantId);
        if (amount == 0) revert ZeroAmount();
        if (bucketId == 0) {
            if (engineDecision == EngineDecision.Approve) revert BucketRequired();
        } else {
            _existingBucket(bucketId);
        }
        // Approve must carry `approved`; pending and reject must not.
        if (
            (engineDecision == EngineDecision.Approve) !=
            (reasonCode == ReasonCode.Approved)
        ) {
            revert EngineCodeMismatch(engineDecision, reasonCode);
        }
    }

    /// @dev Applies the check order documented on `authorize` and returns the
    /// final status and code, and whether a valid temporary pass matched.
    function _evaluate(
        uint256 cardId,
        bytes32 merchantId,
        uint256 bucketId,
        uint256 amount,
        EngineDecision engineDecision,
        ReasonCode engineCode
    ) private view returns (AuthStatus, ReasonCode, bool passValid) {
        if (_cards[cardId].status != CardStatus.Active) {
            return (AuthStatus.Declined, ReasonCode.CardInactive, false);
        }
        bytes32 categoryKey = keccak256(bytes(_merchants[merchantId].category));
        if (_blockedCategories[categoryKey]) {
            return (AuthStatus.Declined, ReasonCode.BlockedCategory, false);
        }
        Bucket storage bucket = _buckets[bucketId];
        if (bucketId != 0) {
            if (amount > bucket.available) {
                return (AuthStatus.Declined, ReasonCode.InsufficientFunds, false);
            }
            if (bucket.perTxLimit != 0 && amount > bucket.perTxLimit) {
                return (AuthStatus.Declined, ReasonCode.OverLimit, false);
            }
        }
        if (engineDecision == EngineDecision.Reject) {
            return (AuthStatus.Declined, engineCode, false);
        }
        if (engineDecision == EngineDecision.Pending) {
            return (AuthStatus.Pending, engineCode, false);
        }
        TempPass storage pass = _tempPasses[cardId][merchantId];
        passValid = block.timestamp < pass.expiresAt && amount <= pass.maxAmount;
        if (
            bucket.approvalThreshold != 0 &&
            amount > bucket.approvalThreshold &&
            !passValid
        ) {
            return (AuthStatus.Pending, ReasonCode.NeedsApproval, false);
        }
        return (AuthStatus.Approved, ReasonCode.Approved, passValid);
    }

    function _engineStatus(
        EngineDecision engineDecision
    ) private pure returns (AuthStatus) {
        if (engineDecision == EngineDecision.Approve) return AuthStatus.Approved;
        if (engineDecision == EngineDecision.Pending) return AuthStatus.Pending;
        return AuthStatus.Declined;
    }

    /// @dev Reason stored when a chain check overrides the engine.
    function _onChainReason(
        ReasonCode code
    ) private pure returns (string memory) {
        if (code == ReasonCode.CardInactive) {
            return "Enforced on-chain: the card is not active.";
        }
        if (code == ReasonCode.BlockedCategory) {
            return "Enforced on-chain: this merchant's category is blocked.";
        }
        if (code == ReasonCode.InsufficientFunds) {
            return "Enforced on-chain: the bucket doesn't have enough available.";
        }
        if (code == ReasonCode.OverLimit) {
            return "Enforced on-chain: over the bucket's per-purchase limit.";
        }
        return "Enforced on-chain: over the bucket's approval threshold.";
    }

    function _emitAuthorizationCreated(
        uint256 authId,
        Authorization storage auth
    ) private {
        emit AuthorizationCreated(
            authId,
            auth.cardId,
            auth.merchantId,
            auth.bucketId,
            auth.amount,
            auth.status,
            auth.reasonCode,
            auth.reason
        );
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
