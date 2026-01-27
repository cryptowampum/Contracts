const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("DorkToken", function () {
  let dorkToken;
  let owner, user1, user2, user3, teamMinter;
  const INITIAL_MINT_PRICE = ethers.parseEther("0.001");
  const MAX_REWARD = ethers.parseEther("20");
  const REWARD_THRESHOLD = ethers.parseEther("100");
  const MIN_TRANSFER_FOR_BONUS = ethers.parseEther("1");
  const TEST_TOKEN_URI = "ipfs://bafkreidtgzztbjue3yamvkd7rdh2hxlsbchd3bclc53s37nvgys2f6s4y4";

  beforeEach(async function () {
    [owner, user1, user2, user3, teamMinter] = await ethers.getSigners();

    const DorkToken = await ethers.getContractFactory("DorkToken");
    dorkToken = await upgrades.deployProxy(DorkToken, [owner.address, TEST_TOKEN_URI], {
      initializer: "initialize",
      kind: "uups"
    });
    await dorkToken.waitForDeployment();
  });

  describe("Initialization", function () {
    it("should initialize with correct name and symbol", async function () {
      expect(await dorkToken.name()).to.equal("DorkToken");
      expect(await dorkToken.symbol()).to.equal("DORK");
    });

    it("should set initial mint price", async function () {
      expect(await dorkToken.mintPrice()).to.equal(INITIAL_MINT_PRICE);
    });

    it("should set owner as team minter", async function () {
      expect(await dorkToken.teamMinters(owner.address)).to.be.true;
    });

    it("should not be paused initially", async function () {
      expect(await dorkToken.paused()).to.be.false;
    });

    it("should set initial token URI", async function () {
      expect(await dorkToken.tokenURI()).to.equal(TEST_TOKEN_URI);
    });
  });

  describe("Public Minting", function () {
    it("should allow minting with correct payment", async function () {
      const amount = 10;
      const cost = INITIAL_MINT_PRICE * BigInt(amount);

      await dorkToken.connect(user1).mint(amount, { value: cost });
      expect(await dorkToken.balanceOf(user1.address)).to.equal(ethers.parseEther("10"));
    });

    it("should refund excess payment", async function () {
      const amount = 5;
      const cost = INITIAL_MINT_PRICE * BigInt(amount);
      const excess = ethers.parseEther("0.01");
      const initialBalance = await ethers.provider.getBalance(user1.address);

      const tx = await dorkToken.connect(user1).mint(amount, { value: cost + excess });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(initialBalance - finalBalance - gasUsed).to.be.closeTo(cost, ethers.parseEther("0.0001"));
    });

    it("should reject minting with insufficient payment", async function () {
      await expect(
        dorkToken.connect(user1).mint(10, { value: ethers.parseEther("0.001") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("should reject minting more than MAX_BATCH_MINT", async function () {
      await expect(
        dorkToken.connect(user1).mint(1001, { value: ethers.parseEther("2") })
      ).to.be.revertedWith("Exceeds max batch mint");
    });

    it("should reject minting zero tokens", async function () {
      await expect(
        dorkToken.connect(user1).mint(0, { value: 0 })
      ).to.be.revertedWith("Amount must be positive");
    });
  });

  describe("Team Minting", function () {
    it("should allow owner to team mint", async function () {
      await dorkToken.teamMint(user1.address, 100);
      expect(await dorkToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("should allow team minter to mint", async function () {
      await dorkToken.setTeamMinter(teamMinter.address, true);
      await dorkToken.connect(teamMinter).teamMint(user1.address, 50);
      expect(await dorkToken.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
    });

    it("should reject unauthorized team mint", async function () {
      await expect(
        dorkToken.connect(user1).teamMint(user2.address, 10)
      ).to.be.revertedWith("Not authorized");
    });

    it("should batch team mint", async function () {
      await dorkToken.batchTeamMint(
        [user1.address, user2.address, user3.address],
        [10, 20, 30]
      );
      expect(await dorkToken.balanceOf(user1.address)).to.equal(ethers.parseEther("10"));
      expect(await dorkToken.balanceOf(user2.address)).to.equal(ethers.parseEther("20"));
      expect(await dorkToken.balanceOf(user3.address)).to.equal(ethers.parseEther("30"));
    });

    it("should mint to reward pool", async function () {
      await dorkToken.mintToRewardPool(1000);
      expect(await dorkToken.getRewardPoolBalance()).to.equal(ethers.parseEther("1000"));
    });
  });

  describe("Transfer Bonus Mechanics", function () {
    beforeEach(async function () {
      // Setup: give user1 50 DORK and contract 1000 DORK for rewards
      await dorkToken.teamMint(user1.address, 50);
      await dorkToken.mintToRewardPool(1000);
    });

    it("should give 2x bonus (up to 20) for sender with <= 100 DORK", async function () {
      // User1 has 50 DORK, sends 5 to user2
      // Should get 2x = 10 DORK bonus
      const initialBalance = await dorkToken.balanceOf(user1.address);

      await dorkToken.connect(user1).transfer(user2.address, ethers.parseEther("5"));

      const finalBalance = await dorkToken.balanceOf(user1.address);
      const user2Balance = await dorkToken.balanceOf(user2.address);

      // User1: 50 - 5 + 10 (bonus) = 55
      expect(finalBalance).to.equal(ethers.parseEther("55"));
      // User2: 5
      expect(user2Balance).to.equal(ethers.parseEther("5"));
    });

    it("should cap bonus at 20 DORK", async function () {
      // User1 has 50 DORK, sends 15 to user2
      // 2x = 30, but capped at 20
      await dorkToken.connect(user1).transfer(user2.address, ethers.parseEther("15"));

      const user1Balance = await dorkToken.balanceOf(user1.address);
      // User1: 50 - 15 + 20 (capped bonus) = 55
      expect(user1Balance).to.equal(ethers.parseEther("55"));
    });

    it("should give 1x bonus for sender with > 100 DORK", async function () {
      // Give user1 more tokens (now has 150 total)
      await dorkToken.teamMint(user1.address, 100);

      // User1 has 150 DORK, sends 10 to user2
      // Should get 1x = 10 DORK bonus
      await dorkToken.connect(user1).transfer(user2.address, ethers.parseEther("10"));

      const user1Balance = await dorkToken.balanceOf(user1.address);
      // User1: 150 - 10 + 10 (1x bonus) = 150
      expect(user1Balance).to.equal(ethers.parseEther("150"));
    });

    it("should cap 1x bonus at 20 DORK", async function () {
      // Give user1 more tokens
      await dorkToken.teamMint(user1.address, 100);

      // User1 has 150 DORK, sends 30 to user2
      // 1x = 30, but capped at 20
      await dorkToken.connect(user1).transfer(user2.address, ethers.parseEther("30"));

      const user1Balance = await dorkToken.balanceOf(user1.address);
      // User1: 150 - 30 + 20 (capped bonus) = 140
      expect(user1Balance).to.equal(ethers.parseEther("140"));
    });

    it("should not give bonus if contract pool is empty", async function () {
      // Drain the pool
      await dorkToken.withdrawDorkFromPool(0); // withdraws all

      await dorkToken.connect(user1).transfer(user2.address, ethers.parseEther("10"));

      const user1Balance = await dorkToken.balanceOf(user1.address);
      // User1: 50 - 10 + 0 (no bonus) = 40
      expect(user1Balance).to.equal(ethers.parseEther("40"));
    });

    it("should only give available bonus if pool is low", async function () {
      // Set up pool with only 5 DORK
      await dorkToken.withdrawDorkFromPool(0);
      await dorkToken.mintToRewardPool(5);

      // User1 sends 10, would get 20 bonus but pool only has 5
      await dorkToken.connect(user1).transfer(user2.address, ethers.parseEther("10"));

      const user1Balance = await dorkToken.balanceOf(user1.address);
      // User1: 50 - 10 + 5 (limited by pool) = 45
      expect(user1Balance).to.equal(ethers.parseEther("45"));
    });

    it("should not give bonus for transfers less than 1 DORK", async function () {
      // User1 sends 0.5 DORK (less than minimum)
      await dorkToken.connect(user1).transfer(user2.address, ethers.parseEther("0.5"));

      const user1Balance = await dorkToken.balanceOf(user1.address);
      const poolBalance = await dorkToken.getRewardPoolBalance();

      // User1: 50 - 0.5 = 49.5 (no bonus)
      expect(user1Balance).to.equal(ethers.parseEther("49.5"));
      // Pool unchanged
      expect(poolBalance).to.equal(ethers.parseEther("1000"));
    });

    it("should give bonus for transfers of exactly 1 DORK", async function () {
      // User1 sends exactly 1 DORK (minimum for bonus)
      await dorkToken.connect(user1).transfer(user2.address, ethers.parseEther("1"));

      const user1Balance = await dorkToken.balanceOf(user1.address);
      // User1: 50 - 1 + 2 (2x bonus) = 51
      expect(user1Balance).to.equal(ethers.parseEther("51"));
    });
  });

  describe("Self-Transfer Penalty", function () {
    beforeEach(async function () {
      await dorkToken.teamMint(user1.address, 100);
      await dorkToken.mintToRewardPool(1000);
    });

    it("should penalize self-transfer with 90% to contract", async function () {
      const initialBalance = await dorkToken.balanceOf(user1.address);
      const initialPool = await dorkToken.getRewardPoolBalance();

      // User1 sends 10 to themselves
      await dorkToken.connect(user1).transfer(user1.address, ethers.parseEther("10"));

      const finalBalance = await dorkToken.balanceOf(user1.address);
      const finalPool = await dorkToken.getRewardPoolBalance();

      // User1: 100 - 9 (90% penalty) = 91
      expect(finalBalance).to.equal(ethers.parseEther("91"));
      // Pool: 1000 + 9 = 1009
      expect(finalPool).to.equal(ethers.parseEther("1009"));
    });

    it("should not give bonus on self-transfer", async function () {
      const initialPool = await dorkToken.getRewardPoolBalance();

      await dorkToken.connect(user1).transfer(user1.address, ethers.parseEther("50"));

      const finalBalance = await dorkToken.balanceOf(user1.address);
      // User1: 100 - 45 (90% of 50) = 55 (no bonus)
      expect(finalBalance).to.equal(ethers.parseEther("55"));
    });
  });

  describe("Transfer Without Bonus", function () {
    beforeEach(async function () {
      await dorkToken.teamMint(user1.address, 100);
      await dorkToken.mintToRewardPool(1000);
    });

    it("should transfer without bonus using transferNoBonus", async function () {
      await dorkToken.connect(user1).transferNoBonus(user2.address, ethers.parseEther("10"));

      const user1Balance = await dorkToken.balanceOf(user1.address);
      const user2Balance = await dorkToken.balanceOf(user2.address);
      const poolBalance = await dorkToken.getRewardPoolBalance();

      // Straight transfer: 100 - 10 = 90
      expect(user1Balance).to.equal(ethers.parseEther("90"));
      expect(user2Balance).to.equal(ethers.parseEther("10"));
      // Pool unchanged
      expect(poolBalance).to.equal(ethers.parseEther("1000"));
    });

    it("should self-transfer without penalty using transferNoBonus", async function () {
      await dorkToken.connect(user1).transferNoBonus(user1.address, ethers.parseEther("10"));

      const user1Balance = await dorkToken.balanceOf(user1.address);
      // Balance unchanged (transferred to self)
      expect(user1Balance).to.equal(ethers.parseEther("100"));
    });

    it("should work with transferFromNoBonus", async function () {
      await dorkToken.connect(user1).approve(user2.address, ethers.parseEther("50"));
      await dorkToken.connect(user2).transferFromNoBonus(user1.address, user3.address, ethers.parseEther("20"));

      expect(await dorkToken.balanceOf(user1.address)).to.equal(ethers.parseEther("80"));
      expect(await dorkToken.balanceOf(user3.address)).to.equal(ethers.parseEther("20"));
    });
  });

  describe("Bonus Calculation View", function () {
    beforeEach(async function () {
      await dorkToken.teamMint(user1.address, 50);
      await dorkToken.mintToRewardPool(1000);
    });

    it("should calculate correct bonus for low balance sender", async function () {
      // User1 has 50 DORK (below threshold), sending 5
      // 2x bonus = 10
      const bonus = await dorkToken.calculateBonus(user1.address, ethers.parseEther("5"));
      expect(bonus).to.equal(ethers.parseEther("10"));
    });

    it("should calculate capped bonus", async function () {
      // User1 has 50 DORK, sending 15
      // 2x = 30, capped at 20
      const bonus = await dorkToken.calculateBonus(user1.address, ethers.parseEther("15"));
      expect(bonus).to.equal(MAX_REWARD);
    });

    it("should return 0 when pool is empty", async function () {
      await dorkToken.withdrawDorkFromPool(0);
      const bonus = await dorkToken.calculateBonus(user1.address, ethers.parseEther("10"));
      expect(bonus).to.equal(0);
    });

    it("should return 0 for transfers below minimum", async function () {
      const bonus = await dorkToken.calculateBonus(user1.address, ethers.parseEther("0.5"));
      expect(bonus).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("should allow owner to set mint price", async function () {
      const newPrice = ethers.parseEther("0.002");
      await dorkToken.setMintPrice(newPrice);
      expect(await dorkToken.mintPrice()).to.equal(newPrice);
    });

    it("should allow owner to pause and unpause", async function () {
      await dorkToken.pause();
      expect(await dorkToken.paused()).to.be.true;

      await dorkToken.unpause();
      expect(await dorkToken.paused()).to.be.false;
    });

    it("should reject minting when paused", async function () {
      await dorkToken.pause();
      await expect(
        dorkToken.connect(user1).mint(1, { value: INITIAL_MINT_PRICE })
      ).to.be.revertedWith("Pausable: paused");
    });

    it("should reject transfers when paused", async function () {
      await dorkToken.teamMint(user1.address, 100);
      await dorkToken.pause();

      await expect(
        dorkToken.connect(user1).transfer(user2.address, ethers.parseEther("10"))
      ).to.be.revertedWith("Pausable: paused");
    });

    it("should allow owner to update token URI", async function () {
      const newURI = "ipfs://newmetadata123";
      await dorkToken.setTokenURI(newURI);
      expect(await dorkToken.tokenURI()).to.equal(newURI);
    });

    it("should reject non-owner setting token URI", async function () {
      await expect(
        dorkToken.connect(user1).setTokenURI("ipfs://evil")
      ).to.be.revertedWithCustomError(dorkToken, "OwnableUnauthorizedAccount");
    });

    it("should emit TokenURIUpdated event", async function () {
      const newURI = "ipfs://updated";
      await expect(dorkToken.setTokenURI(newURI))
        .to.emit(dorkToken, "TokenURIUpdated")
        .withArgs(TEST_TOKEN_URI, newURI);
    });
  });

  describe("Token Recovery", function () {
    let mockERC20, mockERC721, mockERC1155;

    beforeEach(async function () {
      // Deploy mock tokens for testing
      const MockERC20 = await ethers.getContractFactory("UnicornCredit");
      mockERC20 = await MockERC20.deploy();
      await mockERC20.waitForDeployment();
    });

    it("should withdraw ETH", async function () {
      // Send ETH to contract
      await user1.sendTransaction({
        to: await dorkToken.getAddress(),
        value: ethers.parseEther("1")
      });

      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      await dorkToken.withdraw();
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

      expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
    });

    it("should recover ERC20 tokens", async function () {
      // Mint some mock tokens to the Dork contract
      await mockERC20.setTeamMinter(owner.address, true);
      await mockERC20.teamMint(await dorkToken.getAddress(), 100);

      await dorkToken.recoverERC20(await mockERC20.getAddress(), 0);
      expect(await mockERC20.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
    });

    it("should not allow recovering DORK via recoverERC20", async function () {
      await dorkToken.mintToRewardPool(100);

      await expect(
        dorkToken.recoverERC20(await dorkToken.getAddress(), 0)
      ).to.be.revertedWith("Use withdrawDorkFromPool for DORK");
    });

    it("should allow withdrawing DORK from pool", async function () {
      await dorkToken.mintToRewardPool(100);
      await dorkToken.withdrawDorkFromPool(50);

      expect(await dorkToken.balanceOf(owner.address)).to.equal(ethers.parseEther("50"));
      expect(await dorkToken.getRewardPoolBalance()).to.equal(ethers.parseEther("50"));
    });
  });

  describe("UUPS Upgrade", function () {
    it("should allow owner to upgrade", async function () {
      const DorkTokenV2 = await ethers.getContractFactory("DorkToken");
      const upgraded = await upgrades.upgradeProxy(await dorkToken.getAddress(), DorkTokenV2);
      expect(await upgraded.getAddress()).to.equal(await dorkToken.getAddress());
    });

    it("should reject upgrade from non-owner", async function () {
      const DorkTokenV2 = await ethers.getContractFactory("DorkToken", user1);
      await expect(
        upgrades.upgradeProxy(await dorkToken.getAddress(), DorkTokenV2)
      ).to.be.revertedWithCustomError(dorkToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Edge Cases", function () {
    beforeEach(async function () {
      await dorkToken.mintToRewardPool(1000);
    });

    it("should handle transfer of 0 amount", async function () {
      await dorkToken.teamMint(user1.address, 100);
      await dorkToken.connect(user1).transfer(user2.address, 0);
      expect(await dorkToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("should handle transferFrom with bonus", async function () {
      await dorkToken.teamMint(user1.address, 50);
      await dorkToken.connect(user1).approve(user2.address, ethers.parseEther("100"));

      // user2 transfers from user1 to user3
      await dorkToken.connect(user2).transferFrom(user1.address, user3.address, ethers.parseEther("10"));

      // user1 should get the bonus (they're the sender of funds)
      const user1Balance = await dorkToken.balanceOf(user1.address);
      // 50 - 10 + 20 (2x capped at 20) = 60
      expect(user1Balance).to.equal(ethers.parseEther("60"));
    });

    it("should skip bonus for transfers from contract", async function () {
      // This tests that internal contract transfers don't trigger bonus
      await dorkToken.mintToRewardPool(100);
      const poolBefore = await dorkToken.getRewardPoolBalance();

      // Owner withdraws from pool (contract -> owner)
      await dorkToken.withdrawDorkFromPool(50);

      const poolAfter = await dorkToken.getRewardPoolBalance();
      // Pool should just decrease by 50, no bonus logic
      expect(poolBefore - poolAfter).to.equal(ethers.parseEther("50"));
    });
  });
});
