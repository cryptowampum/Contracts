const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UnicornCredit", function () {
  let UnicornCredit;
  let unicornCredit;
  let owner;
  let teamMinter;
  let user1;
  let user2;

  const MINT_PRICE = ethers.parseEther("0.01");
  const ONE_TOKEN = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, teamMinter, user1, user2] = await ethers.getSigners();

    UnicornCredit = await ethers.getContractFactory("UnicornCredit");
    unicornCredit = await UnicornCredit.deploy();
    await unicornCredit.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await unicornCredit.name()).to.equal("UnicornCredit");
      expect(await unicornCredit.symbol()).to.equal("UCRED");
    });

    it("Should set the owner as team minter", async function () {
      expect(await unicornCredit.teamMinters(owner.address)).to.be.true;
    });

    it("Should set the correct initial mint price", async function () {
      expect(await unicornCredit.mintPrice()).to.equal(MINT_PRICE);
    });

    it("Should not be paused initially", async function () {
      expect(await unicornCredit.paused()).to.be.false;
    });
  });

  describe("Public Minting", function () {
    it("Should mint tokens when paying exact price", async function () {
      await unicornCredit.connect(user1).mint(1, { value: MINT_PRICE });
      expect(await unicornCredit.balanceOf(user1.address)).to.equal(ONE_TOKEN);
    });

    it("Should mint multiple tokens at once", async function () {
      await unicornCredit.connect(user1).mint(5, { value: MINT_PRICE * 5n });
      expect(await unicornCredit.balanceOf(user1.address)).to.equal(ONE_TOKEN * 5n);
    });

    it("Should refund excess payment", async function () {
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await unicornCredit.connect(user1).mint(1, { value: MINT_PRICE * 2n });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(user1.address);

      // Should have spent MINT_PRICE + gas, not 2x MINT_PRICE
      expect(balanceBefore - balanceAfter).to.be.lessThan(MINT_PRICE * 2n);
    });

    it("Should revert with insufficient payment", async function () {
      await expect(
        unicornCredit.connect(user1).mint(1, { value: MINT_PRICE / 2n })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert with zero amount", async function () {
      await expect(
        unicornCredit.connect(user1).mint(0, { value: 0 })
      ).to.be.revertedWith("Amount must be positive");
    });

    it("Should revert when exceeding max batch mint", async function () {
      await expect(
        unicornCredit.connect(user1).mint(101, { value: MINT_PRICE * 101n })
      ).to.be.revertedWith("Exceeds max batch mint");
    });

    it("Should emit Minted event", async function () {
      await expect(unicornCredit.connect(user1).mint(1, { value: MINT_PRICE }))
        .to.emit(unicornCredit, "Minted")
        .withArgs(user1.address, 1n);
    });
  });

  describe("Team Minting", function () {
    beforeEach(async function () {
      await unicornCredit.setTeamMinter(teamMinter.address, true);
    });

    it("Should allow team minter to mint for free", async function () {
      await unicornCredit.connect(teamMinter).teamMint(user1.address, 1);
      expect(await unicornCredit.balanceOf(user1.address)).to.equal(ONE_TOKEN);
    });

    it("Should allow batch team minting", async function () {
      await unicornCredit.connect(teamMinter).batchTeamMint(
        [user1.address, user2.address],
        [1, 2]
      );
      expect(await unicornCredit.balanceOf(user1.address)).to.equal(ONE_TOKEN);
      expect(await unicornCredit.balanceOf(user2.address)).to.equal(ONE_TOKEN * 2n);
    });

    it("Should revert if not authorized", async function () {
      await expect(
        unicornCredit.connect(user1).teamMint(user2.address, 1)
      ).to.be.revertedWith("Not authorized to team mint");
    });

    it("Should revert minting to zero address", async function () {
      await expect(
        unicornCredit.connect(teamMinter).teamMint(ethers.ZeroAddress, 1)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should emit TeamMinted event", async function () {
      await expect(unicornCredit.connect(teamMinter).teamMint(user1.address, 5))
        .to.emit(unicornCredit, "TeamMinted")
        .withArgs(teamMinter.address, user1.address, 5n);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await unicornCredit.connect(user1).mint(5, { value: MINT_PRICE * 5n });
    });

    it("Should allow users to burn their tokens", async function () {
      await unicornCredit.connect(user1).burn(ONE_TOKEN);
      expect(await unicornCredit.balanceOf(user1.address)).to.equal(ONE_TOKEN * 4n);
    });

    it("Should allow burnFrom with approval", async function () {
      await unicornCredit.connect(user1).approve(user2.address, ONE_TOKEN);
      await unicornCredit.connect(user2).burnFrom(user1.address, ONE_TOKEN);
      expect(await unicornCredit.balanceOf(user1.address)).to.equal(ONE_TOKEN * 4n);
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause", async function () {
      await unicornCredit.pause();
      expect(await unicornCredit.paused()).to.be.true;
    });

    it("Should prevent minting when paused", async function () {
      await unicornCredit.pause();
      await expect(
        unicornCredit.connect(user1).mint(1, { value: MINT_PRICE })
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow owner to unpause", async function () {
      await unicornCredit.pause();
      await unicornCredit.unpause();
      expect(await unicornCredit.paused()).to.be.false;
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(unicornCredit.connect(user1).pause()).to.be.reverted;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set team minter", async function () {
      await unicornCredit.setTeamMinter(user1.address, true);
      expect(await unicornCredit.teamMinters(user1.address)).to.be.true;
    });

    it("Should allow owner to set mint price", async function () {
      const newPrice = ethers.parseEther("0.02");
      await unicornCredit.setMintPrice(newPrice);
      expect(await unicornCredit.mintPrice()).to.equal(newPrice);
    });

    it("Should allow owner to withdraw funds", async function () {
      await unicornCredit.connect(user1).mint(10, { value: MINT_PRICE * 10n });

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      await unicornCredit.withdraw();
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(ownerBalanceAfter).to.be.greaterThan(ownerBalanceBefore);
    });
  });

  describe("View Functions", function () {
    it("Should return correct mint cost", async function () {
      expect(await unicornCredit.getMintCost(5)).to.equal(MINT_PRICE * 5n);
    });

    it("Should return minting active status", async function () {
      expect(await unicornCredit.isMintingActive()).to.be.true;
      await unicornCredit.pause();
      expect(await unicornCredit.isMintingActive()).to.be.false;
    });
  });
});
