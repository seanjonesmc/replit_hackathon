import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

const PARENT = ethers.id("demo-parent");
const DEPENDENT = ethers.id("demo-dependent");
const TRADER_JOES = ethers.id("merchant:trader-joes");
const TAVERN = ethers.id("merchant:the-tipsy-tavern");
const APPLE = ethers.id("merchant:apple-store");
const UNKNOWN_MERCHANT = ethers.id("merchant:unknown");

// Enum values in their Solidity declaration order.
const CardStatus = { Issued: 0n, Active: 1n, Frozen: 2n };
const Reason = {
  Approved: 0n,
  BlockedCategory: 1n,
  InsufficientFunds: 2n,
  OverLimit: 3n,
  CardInactive: 4n,
  NeedsApproval: 5n,
  OutsideHours: 6n,
};
const Status = {
  Approved: 0n,
  Declined: 1n,
  Pending: 2n,
  ParentApproved: 3n,
  ParentDeclined: 4n,
  Captured: 5n,
};
const Engine = { Approve: 0n, Pending: 1n, Reject: 2n };

const ON_CHAIN = {
  cardInactive: "Enforced on-chain: the card is not active.",
  blockedCategory: "Enforced on-chain: this merchant's category is blocked.",
  insufficientFunds:
    "Enforced on-chain: the bucket doesn't have enough available.",
  overLimit: "Enforced on-chain: over the bucket's per-purchase limit.",
  needsApproval: "Enforced on-chain: over the bucket's approval threshold.",
};

const CARD = 1n;
/** $60 per purchase, approval over $75, $100 funded. */
const FOOD = 1n;
/** $200 per purchase, approval over $100, $150 funded. */
const SCHOOL = 2n;

async function deployFamily() {
  const [, other, groceryPayout, barPayout, techPayout] =
    await ethers.getSigners();
  const token = await ethers.deployContract("MockUSD");
  const cardNetwork = await ethers.deployContract("FamilyCardNetwork", [
    await token.getAddress(),
  ]);
  await token.setMinter(await cardNetwork.getAddress(), true);

  await cardNetwork.linkBankAccount(PARENT, "Demo Bank", "4417");
  await cardNetwork.bankDeposit(PARENT, 50000n);
  await cardNetwork.createBucket("Food", 6000n, 7500n);
  await cardNetwork.createBucket("School", 20000n, 10000n);
  await cardNetwork.fundBucket(PARENT, FOOD, 10000n);
  await cardNetwork.fundBucket(PARENT, SCHOOL, 15000n);

  await cardNetwork.issueCard(DEPENDENT, "4242", 9, 2029);
  await cardNetwork.activateCard(CARD);

  await cardNetwork.registerMerchant(
    TRADER_JOES,
    "Trader Joe's",
    5411,
    "grocery",
    groceryPayout.address,
  );
  await cardNetwork.registerMerchant(
    TAVERN,
    "The Tipsy Tavern",
    5813,
    "bar",
    barPayout.address,
  );
  await cardNetwork.registerMerchant(
    APPLE,
    "Apple Store",
    5732,
    "electronics",
    techPayout.address,
  );

  return { token, cardNetwork, other, groceryPayout, techPayout };
}

type Network = Awaited<ReturnType<typeof deployFamily>>["cardNetwork"];

async function expectBucket(
  cardNetwork: Network,
  bucketId: bigint,
  expected: { available: bigint; held: bigint; spent: bigint },
) {
  const bucket = await cardNetwork.getBucket(bucketId);
  expect({
    available: bucket.available,
    held: bucket.held,
    spent: bucket.spent,
  }).to.deep.equal(expected);
}

describe("FamilyCardNetwork cards, categories and merchants", function () {
  it("issues cards from ID 1 and moves them Issued → Active ⇄ Frozen", async function () {
    const { cardNetwork } = await networkHelpers.loadFixture(deployFamily);

    const first = await cardNetwork.getCard(CARD);
    expect(first.dependentId).to.equal(DEPENDENT);
    expect(first.last4).to.equal("4242");
    expect(first.expiryMonth).to.equal(9n);
    expect(first.expiryYear).to.equal(2029n);
    expect(first.status).to.equal(CardStatus.Active);

    await expect(cardNetwork.issueCard(DEPENDENT, "1111", 12, 2030))
      .to.emit(cardNetwork, "CardIssued")
      .withArgs(2n, DEPENDENT, "1111", 12n, 2030n);
    expect(await cardNetwork.cardCount()).to.equal(2n);
    expect((await cardNetwork.getCard(2n)).status).to.equal(CardStatus.Issued);

    await expect(cardNetwork.freezeCard(2n))
      .to.be.revertedWithCustomError(cardNetwork, "InvalidCardStatus")
      .withArgs(2n, CardStatus.Issued);
    await expect(cardNetwork.activateCard(2n))
      .to.emit(cardNetwork, "CardActivated")
      .withArgs(2n);
    await expect(cardNetwork.activateCard(2n))
      .to.be.revertedWithCustomError(cardNetwork, "InvalidCardStatus")
      .withArgs(2n, CardStatus.Active);
    await expect(cardNetwork.unfreezeCard(2n))
      .to.be.revertedWithCustomError(cardNetwork, "InvalidCardStatus")
      .withArgs(2n, CardStatus.Active);
    await expect(cardNetwork.freezeCard(2n))
      .to.emit(cardNetwork, "CardFrozen")
      .withArgs(2n);
    expect((await cardNetwork.getCard(2n)).status).to.equal(CardStatus.Frozen);
    await expect(cardNetwork.unfreezeCard(2n))
      .to.emit(cardNetwork, "CardUnfrozen")
      .withArgs(2n);
    expect((await cardNetwork.getCard(2n)).status).to.equal(CardStatus.Active);

    await expect(cardNetwork.getCard(3n))
      .to.be.revertedWithCustomError(cardNetwork, "UnknownCard")
      .withArgs(3n);
    await expect(cardNetwork.activateCard(0n))
      .to.be.revertedWithCustomError(cardNetwork, "UnknownCard")
      .withArgs(0n);
    await expect(cardNetwork.issueCard(DEPENDENT, "1111", 13, 2030))
      .to.be.revertedWithCustomError(cardNetwork, "InvalidExpiryMonth")
      .withArgs(13n);
  });

  it("blocks and unblocks categories by their plain lowercase name", async function () {
    const { cardNetwork } = await networkHelpers.loadFixture(deployFamily);

    await expect(cardNetwork.setBlockedCategory("bar", true))
      .to.emit(cardNetwork, "CategoryBlocked")
      .withArgs("bar", true);
    expect(await cardNetwork.isCategoryBlocked("bar")).to.equal(true);
    expect(await cardNetwork.isCategoryBlocked("grocery")).to.equal(false);

    await expect(cardNetwork.setBlockedCategory("bar", false))
      .to.emit(cardNetwork, "CategoryBlocked")
      .withArgs("bar", false);
    expect(await cardNetwork.isCategoryBlocked("bar")).to.equal(false);

    for (const category of ["Bar", "BAR", ""]) {
      await expect(cardNetwork.setBlockedCategory(category, true))
        .to.be.revertedWithCustomError(cardNetwork, "InvalidCategory")
        .withArgs(category);
    }
  });

  it("registers each merchant ID once", async function () {
    const { cardNetwork, groceryPayout } =
      await networkHelpers.loadFixture(deployFamily);
    const steam = ethers.id("merchant:steam");

    const joes = await cardNetwork.getMerchant(TRADER_JOES);
    expect(joes.name).to.equal("Trader Joe's");
    expect(joes.mcc).to.equal(5411n);
    expect(joes.category).to.equal("grocery");
    expect(joes.payoutAddress).to.equal(groceryPayout.address);
    expect(await cardNetwork.isMerchantRegistered(TRADER_JOES)).to.equal(true);

    await expect(
      cardNetwork.registerMerchant(
        steam,
        "Steam",
        5816,
        "gaming",
        groceryPayout.address,
      ),
    )
      .to.emit(cardNetwork, "MerchantRegistered")
      .withArgs(steam, "Steam", 5816n, "gaming", groceryPayout.address);

    await expect(
      cardNetwork.registerMerchant(
        TRADER_JOES,
        "Trader Joe's",
        5411,
        "grocery",
        groceryPayout.address,
      ),
    )
      .to.be.revertedWithCustomError(cardNetwork, "MerchantAlreadyRegistered")
      .withArgs(TRADER_JOES);
    await expect(
      cardNetwork.registerMerchant(
        UNKNOWN_MERCHANT,
        "Nowhere",
        5999,
        "misc",
        ethers.ZeroAddress,
      ),
    ).to.be.revertedWithCustomError(cardNetwork, "ZeroAddress");
    await expect(
      cardNetwork.registerMerchant(
        UNKNOWN_MERCHANT,
        "Nowhere",
        5999,
        "Misc",
        groceryPayout.address,
      ),
    )
      .to.be.revertedWithCustomError(cardNetwork, "InvalidCategory")
      .withArgs("Misc");
    await expect(cardNetwork.getMerchant(UNKNOWN_MERCHANT))
      .to.be.revertedWithCustomError(cardNetwork, "UnknownMerchant")
      .withArgs(UNKNOWN_MERCHANT);
  });
});

describe("FamilyCardNetwork authorizations", function () {
  it("declines a blocked category with blocked_category even when the engine approves", async function () {
    const { cardNetwork } = await networkHelpers.loadFixture(deployFamily);
    await cardNetwork.setBlockedCategory("bar", true);

    const tx = await cardNetwork.authorize(
      CARD,
      TAVERN,
      FOOD,
      3200n,
      Engine.Approve,
      Reason.Approved,
      "Looks fine.",
    );
    await expect(tx)
      .to.emit(cardNetwork, "AuthorizationCreated")
      .withArgs(
        1n,
        CARD,
        TAVERN,
        FOOD,
        3200n,
        Status.Declined,
        Reason.BlockedCategory,
        ON_CHAIN.blockedCategory,
      );

    expect(await cardNetwork.authorizationCount()).to.equal(1n);
    const auth = await cardNetwork.getAuthorization(1n);
    expect(auth.cardId).to.equal(CARD);
    expect(auth.merchantId).to.equal(TAVERN);
    expect(auth.bucketId).to.equal(FOOD);
    expect(auth.amount).to.equal(3200n);
    expect(auth.status).to.equal(Status.Declined);
    expect(auth.reasonCode).to.equal(Reason.BlockedCategory);
    expect(auth.reason).to.equal(ON_CHAIN.blockedCategory);
    const block = await ethers.provider.getBlock((await tx.wait())!.blockNumber);
    expect(auth.timestamp).to.equal(BigInt(block!.timestamp));
    await expectBucket(cardNetwork, FOOD, {
      available: 10000n,
      held: 0n,
      spent: 0n,
    });
  });

  it("declines a frozen card with card_inactive", async function () {
    const { cardNetwork } = await networkHelpers.loadFixture(deployFamily);
    await cardNetwork.freezeCard(CARD);

    await expect(
      cardNetwork.authorize(
        CARD,
        TRADER_JOES,
        FOOD,
        1840n,
        Engine.Approve,
        Reason.Approved,
        "Groceries at Trader Joe's.",
      ),
    )
      .to.emit(cardNetwork, "AuthorizationCreated")
      .withArgs(
        1n,
        CARD,
        TRADER_JOES,
        FOOD,
        1840n,
        Status.Declined,
        Reason.CardInactive,
        ON_CHAIN.cardInactive,
      );
    // When the engine already reached the chain's verdict, its reason stays.
    await expect(
      cardNetwork.authorize(
        CARD,
        TRADER_JOES,
        0n,
        1840n,
        Engine.Reject,
        Reason.CardInactive,
        "Your card is frozen.",
      ),
    )
      .to.emit(cardNetwork, "AuthorizationCreated")
      .withArgs(
        2n,
        CARD,
        TRADER_JOES,
        0n,
        1840n,
        Status.Declined,
        Reason.CardInactive,
        "Your card is frozen.",
      );
    await expectBucket(cardNetwork, FOOD, {
      available: 10000n,
      held: 0n,
      spent: 0n,
    });

    await cardNetwork.unfreezeCard(CARD);
    await cardNetwork.authorize(
      CARD,
      TRADER_JOES,
      FOOD,
      1840n,
      Engine.Approve,
      Reason.Approved,
      "Groceries at Trader Joe's.",
    );
    expect((await cardNetwork.getAuthorization(3n)).status).to.equal(
      Status.Approved,
    );
  });

  it("declines a purchase over the bucket's available balance with insufficient_funds", async function () {
    const { cardNetwork } = await networkHelpers.loadFixture(deployFamily);

    // $160 is within School's $200 limit but over its $150 available, and the
    // balance check runs before the engine's pending verdict.
    await expect(
      cardNetwork.authorize(
        CARD,
        APPLE,
        SCHOOL,
        16000n,
        Engine.Pending,
        Reason.NeedsApproval,
        "Over $100 needs a parent's OK.",
      ),
    )
      .to.emit(cardNetwork, "AuthorizationCreated")
      .withArgs(
        1n,
        CARD,
        APPLE,
        SCHOOL,
        16000n,
        Status.Declined,
        Reason.InsufficientFunds,
        ON_CHAIN.insufficientFunds,
      );
    // Over both available and the limit: the balance check comes first.
    await cardNetwork.authorize(
      CARD,
      APPLE,
      SCHOOL,
      25000n,
      Engine.Approve,
      Reason.Approved,
      "Looks fine.",
    );
    expect((await cardNetwork.getAuthorization(2n)).reasonCode).to.equal(
      Reason.InsufficientFunds,
    );
    await expectBucket(cardNetwork, SCHOOL, {
      available: 15000n,
      held: 0n,
      spent: 0n,
    });
  });

  it("declines a purchase over the bucket's per-purchase limit with over_limit", async function () {
    const { cardNetwork } = await networkHelpers.loadFixture(deployFamily);

    await expect(
      cardNetwork.authorize(
        CARD,
        TRADER_JOES,
        FOOD,
        6500n,
        Engine.Approve,
        Reason.Approved,
        "Looks fine.",
      ),
    )
      .to.emit(cardNetwork, "AuthorizationCreated")
      .withArgs(
        1n,
        CARD,
        TRADER_JOES,
        FOOD,
        6500n,
        Status.Declined,
        Reason.OverLimit,
        ON_CHAIN.overLimit,
      );
  });

  it("approve → hold → capture moves tUSD to the merchant's payout address", async function () {
    const { token, cardNetwork, groceryPayout } =
      await networkHelpers.loadFixture(deployFamily);
    const networkAddress = await cardNetwork.getAddress();

    await expect(
      cardNetwork.authorize(
        CARD,
        TRADER_JOES,
        FOOD,
        1840n,
        Engine.Approve,
        Reason.Approved,
        "Groceries at Trader Joe's.",
      ),
    )
      .to.emit(cardNetwork, "AuthorizationCreated")
      .withArgs(
        1n,
        CARD,
        TRADER_JOES,
        FOOD,
        1840n,
        Status.Approved,
        Reason.Approved,
        "Groceries at Trader Joe's.",
      );
    await expectBucket(cardNetwork, FOOD, {
      available: 8160n,
      held: 1840n,
      spent: 0n,
    });
    // An authorization hold moves no tokens.
    expect(await token.balanceOf(groceryPayout.address)).to.equal(0n);

    await expect(cardNetwork.capture(1n))
      .to.emit(cardNetwork, "AuthorizationCaptured")
      .withArgs(1n, TRADER_JOES, groceryPayout.address, 1840n);

    expect(await token.balanceOf(groceryPayout.address)).to.equal(1840n);
    expect(await token.balanceOf(networkAddress)).to.equal(50000n - 1840n);
    await expectBucket(cardNetwork, FOOD, {
      available: 8160n,
      held: 0n,
      spent: 1840n,
    });
    const food = await cardNetwork.getBucket(FOOD);
    expect(food.available + food.held + food.spent).to.equal(10000n);
    expect((await cardNetwork.getAuthorization(1n)).status).to.equal(
      Status.Captured,
    );

    await expect(cardNetwork.capture(1n))
      .to.be.revertedWithCustomError(cardNetwork, "InvalidAuthorizationStatus")
      .withArgs(1n, Status.Captured);
  });

  it("pending → resolvePending → temporary pass → retry approves above the threshold, once", async function () {
    const { token, cardNetwork, techPayout } =
      await networkHelpers.loadFixture(deployFamily);

    // 1. The engine holds the $129 purchase for a parent: no hold is placed.
    await expect(
      cardNetwork.authorize(
        CARD,
        APPLE,
        SCHOOL,
        12900n,
        Engine.Pending,
        Reason.NeedsApproval,
        "Over $100 needs a parent's OK.",
      ),
    )
      .to.emit(cardNetwork, "AuthorizationCreated")
      .withArgs(
        1n,
        CARD,
        APPLE,
        SCHOOL,
        12900n,
        Status.Pending,
        Reason.NeedsApproval,
        "Over $100 needs a parent's OK.",
      );
    await expectBucket(cardNetwork, SCHOOL, {
      available: 15000n,
      held: 0n,
      spent: 0n,
    });

    // 2. The parent approves; still no money moves.
    await expect(cardNetwork.resolvePending(1n, true, PARENT))
      .to.emit(cardNetwork, "AuthorizationResolved")
      .withArgs(1n, PARENT, true, Status.ParentApproved);
    expect((await cardNetwork.getAuthorization(1n)).status).to.equal(
      Status.ParentApproved,
    );
    await expectBucket(cardNetwork, SCHOOL, {
      available: 15000n,
      held: 0n,
      spent: 0n,
    });

    // 3. The backend grants a 10-minute pass for that merchant and amount.
    const expiresAt = BigInt(await networkHelpers.time.latest()) + 600n;
    await expect(cardNetwork.grantTemporaryPass(CARD, APPLE, 12900n, expiresAt))
      .to.emit(cardNetwork, "TempPassGranted")
      .withArgs(CARD, APPLE, 12900n, expiresAt);

    // 4. The retry is approved above the $100 threshold and captured.
    await expect(
      cardNetwork.authorize(
        CARD,
        APPLE,
        SCHOOL,
        12900n,
        Engine.Approve,
        Reason.Approved,
        "A parent approved this purchase.",
      ),
    )
      .to.emit(cardNetwork, "AuthorizationCreated")
      .withArgs(
        2n,
        CARD,
        APPLE,
        SCHOOL,
        12900n,
        Status.Approved,
        Reason.Approved,
        "A parent approved this purchase.",
      );
    await cardNetwork.capture(2n);
    expect(await token.balanceOf(techPayout.address)).to.equal(12900n);
    await expectBucket(cardNetwork, SCHOOL, {
      available: 2100n,
      held: 0n,
      spent: 12900n,
    });

    // 5. The pass was used up: the same purchase needs approval again.
    await cardNetwork.fundBucket(PARENT, SCHOOL, 15000n);
    await expect(
      cardNetwork.authorize(
        CARD,
        APPLE,
        SCHOOL,
        12900n,
        Engine.Approve,
        Reason.Approved,
        "A parent approved this purchase.",
      ),
    )
      .to.emit(cardNetwork, "AuthorizationCreated")
      .withArgs(
        3n,
        CARD,
        APPLE,
        SCHOOL,
        12900n,
        Status.Pending,
        Reason.NeedsApproval,
        ON_CHAIN.needsApproval,
      );
    await expectBucket(cardNetwork, SCHOOL, {
      available: 17100n,
      held: 0n,
      spent: 12900n,
    });
  });

  it("honours a temporary pass only unexpired, within its maximum, and replaces it on a new grant", async function () {
    const { cardNetwork } = await networkHelpers.loadFixture(deployFamily);
    const approveApple = (amount: bigint) =>
      cardNetwork.authorize(
        CARD,
        APPLE,
        SCHOOL,
        amount,
        Engine.Approve,
        Reason.Approved,
        "A parent approved this purchase.",
      );
    const statusOf = async (authId: bigint) =>
      (await cardNetwork.getAuthorization(authId)).status;

    const now = BigInt(await networkHelpers.time.latest());
    await cardNetwork.grantTemporaryPass(CARD, APPLE, 12000n, now + 600n);
    await approveApple(12900n); // over the pass maximum
    expect(await statusOf(1n)).to.equal(Status.Pending);
    expect((await cardNetwork.getAuthorization(1n)).reasonCode).to.equal(
      Reason.NeedsApproval,
    );

    // A new grant replaces the old pass, and its larger maximum applies.
    await cardNetwork.grantTemporaryPass(CARD, APPLE, 13000n, now + 600n);
    await approveApple(12900n);
    expect(await statusOf(2n)).to.equal(Status.Approved);

    // A pass is no longer valid from its expiresAt second onwards.
    await cardNetwork.fundBucket(PARENT, SCHOOL, 15000n);
    const expiresAt = BigInt(await networkHelpers.time.latest()) + 600n;
    await cardNetwork.grantTemporaryPass(CARD, APPLE, 13000n, expiresAt);
    await networkHelpers.time.setNextBlockTimestamp(expiresAt);
    await approveApple(12900n);
    const expired = await cardNetwork.getAuthorization(3n);
    expect(expired.timestamp).to.equal(expiresAt);
    expect(expired.status).to.equal(Status.Pending);
    expect(expired.reasonCode).to.equal(Reason.NeedsApproval);
  });

  it("keeps the engine's code and reason when its reject or pending verdict stands", async function () {
    const { cardNetwork } = await networkHelpers.loadFixture(deployFamily);

    // A merchant the family blocked by name: its category is not blocked.
    await expect(
      cardNetwork.authorize(
        CARD,
        TRADER_JOES,
        0n,
        1840n,
        Engine.Reject,
        Reason.BlockedCategory,
        "This store is blocked.",
      ),
    )
      .to.emit(cardNetwork, "AuthorizationCreated")
      .withArgs(
        1n,
        CARD,
        TRADER_JOES,
        0n,
        1840n,
        Status.Declined,
        Reason.BlockedCategory,
        "This store is blocked.",
      );
    await expect(
      cardNetwork.authorize(
        CARD,
        TRADER_JOES,
        FOOD,
        1840n,
        Engine.Pending,
        Reason.OutsideHours,
        "Late-night purchases need a parent's OK.",
      ),
    )
      .to.emit(cardNetwork, "AuthorizationCreated")
      .withArgs(
        2n,
        CARD,
        TRADER_JOES,
        FOOD,
        1840n,
        Status.Pending,
        Reason.OutsideHours,
        "Late-night purchases need a parent's OK.",
      );
    await expectBucket(cardNetwork, FOOD, {
      available: 10000n,
      held: 0n,
      spent: 0n,
    });
  });

  it("resolves only pending authorizations and captures only approved ones", async function () {
    const { cardNetwork } = await networkHelpers.loadFixture(deployFamily);
    await cardNetwork.authorize(
      CARD,
      APPLE,
      SCHOOL,
      12900n,
      Engine.Pending,
      Reason.NeedsApproval,
      "Over $100 needs a parent's OK.",
    );
    await cardNetwork.authorize(
      CARD,
      TRADER_JOES,
      FOOD,
      1840n,
      Engine.Approve,
      Reason.Approved,
      "Groceries at Trader Joe's.",
    );

    await expect(cardNetwork.capture(1n))
      .to.be.revertedWithCustomError(cardNetwork, "InvalidAuthorizationStatus")
      .withArgs(1n, Status.Pending);
    await expect(cardNetwork.resolvePending(2n, true, PARENT))
      .to.be.revertedWithCustomError(cardNetwork, "InvalidAuthorizationStatus")
      .withArgs(2n, Status.Approved);

    await expect(cardNetwork.resolvePending(1n, false, PARENT))
      .to.emit(cardNetwork, "AuthorizationResolved")
      .withArgs(1n, PARENT, false, Status.ParentDeclined);
    await expect(cardNetwork.resolvePending(1n, true, PARENT))
      .to.be.revertedWithCustomError(cardNetwork, "InvalidAuthorizationStatus")
      .withArgs(1n, Status.ParentDeclined);

    for (const authId of [0n, 3n]) {
      await expect(cardNetwork.getAuthorization(authId))
        .to.be.revertedWithCustomError(cardNetwork, "UnknownAuthorization")
        .withArgs(authId);
      await expect(cardNetwork.capture(authId))
        .to.be.revertedWithCustomError(cardNetwork, "UnknownAuthorization")
        .withArgs(authId);
    }
  });

  it("reverts malformed authorizations and passes", async function () {
    const { cardNetwork } = await networkHelpers.loadFixture(deployFamily);
    const now = BigInt(await networkHelpers.time.latest());

    await expect(
      cardNetwork.authorize(9n, TRADER_JOES, FOOD, 100n, 0n, 0n, ""),
    )
      .to.be.revertedWithCustomError(cardNetwork, "UnknownCard")
      .withArgs(9n);
    await expect(
      cardNetwork.authorize(CARD, UNKNOWN_MERCHANT, FOOD, 100n, 0n, 0n, ""),
    )
      .to.be.revertedWithCustomError(cardNetwork, "UnknownMerchant")
      .withArgs(UNKNOWN_MERCHANT);
    await expect(
      cardNetwork.authorize(CARD, TRADER_JOES, FOOD, 0n, 0n, 0n, ""),
    ).to.be.revertedWithCustomError(cardNetwork, "ZeroAmount");
    await expect(
      cardNetwork.authorize(CARD, TRADER_JOES, 9n, 100n, 0n, 0n, ""),
    )
      .to.be.revertedWithCustomError(cardNetwork, "UnknownBucket")
      .withArgs(9n);
    await expect(
      cardNetwork.authorize(
        CARD,
        TRADER_JOES,
        0n,
        100n,
        Engine.Approve,
        Reason.Approved,
        "",
      ),
    ).to.be.revertedWithCustomError(cardNetwork, "BucketRequired");
    for (const [decision, code] of [
      [Engine.Approve, Reason.NeedsApproval],
      [Engine.Pending, Reason.Approved],
      [Engine.Reject, Reason.Approved],
    ]) {
      await expect(
        cardNetwork.authorize(CARD, TRADER_JOES, FOOD, 100n, decision, code, ""),
      )
        .to.be.revertedWithCustomError(cardNetwork, "EngineCodeMismatch")
        .withArgs(decision, code);
    }
    expect(await cardNetwork.authorizationCount()).to.equal(0n);

    await expect(cardNetwork.grantTemporaryPass(CARD, APPLE, 100n, now))
      .to.be.revertedWithCustomError(cardNetwork, "PassAlreadyExpired")
      .withArgs(now);
    await expect(
      cardNetwork.grantTemporaryPass(CARD, APPLE, 0n, now + 600n),
    ).to.be.revertedWithCustomError(cardNetwork, "ZeroAmount");
    await expect(cardNetwork.grantTemporaryPass(9n, APPLE, 100n, now + 600n))
      .to.be.revertedWithCustomError(cardNetwork, "UnknownCard")
      .withArgs(9n);
    await expect(
      cardNetwork.grantTemporaryPass(CARD, UNKNOWN_MERCHANT, 100n, now + 600n),
    )
      .to.be.revertedWithCustomError(cardNetwork, "UnknownMerchant")
      .withArgs(UNKNOWN_MERCHANT);
  });

  it("reverts card, merchant and authorization writes from anyone but the operator", async function () {
    const { cardNetwork, other } =
      await networkHelpers.loadFixture(deployFamily);
    await cardNetwork.authorize(
      CARD,
      TRADER_JOES,
      FOOD,
      1840n,
      Engine.Approve,
      Reason.Approved,
      "Groceries at Trader Joe's.",
    );
    const asOther = cardNetwork.connect(other);
    const later = BigInt(await networkHelpers.time.latest()) + 600n;

    for (const call of [
      () => asOther.issueCard(DEPENDENT, "1111", 12, 2030),
      () => asOther.activateCard(CARD),
      () => asOther.freezeCard(CARD),
      () => asOther.unfreezeCard(CARD),
      () => asOther.setBlockedCategory("bar", true),
      () =>
        asOther.registerMerchant(
          UNKNOWN_MERCHANT,
          "Nowhere",
          5999,
          "misc",
          other.address,
        ),
      () =>
        asOther.authorize(
          CARD,
          TRADER_JOES,
          FOOD,
          100n,
          Engine.Approve,
          Reason.Approved,
          "",
        ),
      () => asOther.capture(1n),
      () => asOther.resolvePending(1n, true, PARENT),
      () => asOther.grantTemporaryPass(CARD, APPLE, 100n, later),
    ]) {
      await expect(call())
        .to.be.revertedWithCustomError(
          cardNetwork,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);
    }
  });
});
