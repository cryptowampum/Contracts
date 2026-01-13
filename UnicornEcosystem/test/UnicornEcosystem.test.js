const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UnicornEcosystem", function () {
  let UnicornCredit;
  let UnicornEcosystem;
  let unicornCredit;
  let unicornEcosystem;
  let owner;
  let teamMinter;
  let user1;
  let user2;

  const MINT_PRICE = ethers.parseEther("0.01");
  const ONE_TOKEN = ethers.parseEther("1");
  const COMMUNITY_TOKEN_OFFSET = 1_000_000_000n;

  const BASE_SUBDOMAIN_IMAGE = "ipfs://QmSubdomainImage";
  const BASE_COMMUNITY_IMAGE = "ipfs://QmCommunityImage";

  beforeEach(async function () {
    [owner, teamMinter, user1, user2] = await ethers.getSigners();

    // Deploy UnicornCredit
    UnicornCredit = await ethers.getContractFactory("UnicornCredit");
    unicornCredit = await UnicornCredit.deploy();
    await unicornCredit.waitForDeployment();

    // Deploy UnicornEcosystem
    UnicornEcosystem = await ethers.getContractFactory("UnicornEcosystem");
    unicornEcosystem = await UnicornEcosystem.deploy(
      await unicornCredit.getAddress(),
      BASE_SUBDOMAIN_IMAGE,
      BASE_COMMUNITY_IMAGE
    );
    await unicornEcosystem.waitForDeployment();

    // Setup: Give user1 some UCRED tokens
    await unicornCredit.teamMint(user1.address, 10);

    // User1 approves ecosystem to spend UCRED
    await unicornCredit.connect(user1).approve(
      await unicornEcosystem.getAddress(),
      ethers.MaxUint256
    );
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await unicornEcosystem.name()).to.equal("Unicorn Ecosystem");
      expect(await unicornEcosystem.symbol()).to.equal("UNICORN");
    });

    it("Should set the correct UnicornCredit address", async function () {
      expect(await unicornEcosystem.unicornCredit()).to.equal(
        await unicornCredit.getAddress()
      );
    });

    it("Should set the owner as team minter", async function () {
      expect(await unicornEcosystem.teamMinters(owner.address)).to.be.true;
    });

    it("Should not be paused initially", async function () {
      expect(await unicornEcosystem.paused()).to.be.false;
    });
  });

  describe("Name Validation", function () {
    it("Should accept valid lowercase names", async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("alice");
      expect(await unicornEcosystem.resolveSubdomain("alice")).to.equal(user1.address);
    });

    it("Should normalize uppercase to lowercase", async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("ALICE");
      expect(await unicornEcosystem.resolveSubdomain("alice")).to.equal(user1.address);
    });

    it("Should accept names with numbers", async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("alice123");
      expect(await unicornEcosystem.resolveSubdomain("alice123")).to.equal(user1.address);
    });

    it("Should accept names with hyphens in middle", async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("alice-bob");
      expect(await unicornEcosystem.resolveSubdomain("alice-bob")).to.equal(user1.address);
    });

    it("Should reject names starting with hyphen", async function () {
      await expect(
        unicornEcosystem.connect(user1).claimSubdomain("-alice")
      ).to.be.revertedWith("Invalid characters in name");
    });

    it("Should reject names ending with hyphen", async function () {
      await expect(
        unicornEcosystem.connect(user1).claimSubdomain("alice-")
      ).to.be.revertedWith("Invalid characters in name");
    });

    it("Should reject names with special characters", async function () {
      await expect(
        unicornEcosystem.connect(user1).claimSubdomain("alice@bob")
      ).to.be.revertedWith("Invalid characters in name");
    });

    it("Should reject empty names", async function () {
      await expect(
        unicornEcosystem.connect(user1).claimSubdomain("")
      ).to.be.revertedWith("Name too short");
    });

    it("Should reject names that are too long", async function () {
      const longName = "a".repeat(33);
      await expect(
        unicornEcosystem.connect(user1).claimSubdomain(longName)
      ).to.be.revertedWith("Name too long");
    });
  });

  describe("Claiming Subdomains", function () {
    it("Should claim subdomain and mint both NFTs", async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("alice");

      // Check subdomain NFT (token ID 1)
      expect(await unicornEcosystem.ownerOf(1)).to.equal(user1.address);

      // Check community NFT (token ID 1,000,000,001)
      expect(await unicornEcosystem.ownerOf(COMMUNITY_TOKEN_OFFSET + 1n)).to.equal(user1.address);
    });

    it("Should burn 1 UCRED when claiming", async function () {
      const balanceBefore = await unicornCredit.balanceOf(user1.address);
      await unicornEcosystem.connect(user1).claimSubdomain("alice");
      const balanceAfter = await unicornCredit.balanceOf(user1.address);

      expect(balanceBefore - balanceAfter).to.equal(ONE_TOKEN);
    });

    it("Should store the subdomain name", async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("alice");
      expect(await unicornEcosystem.getSubdomainName(1)).to.equal("alice");
    });

    it("Should return correct full domain", async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("alice");
      expect(await unicornEcosystem.getFullDomain(1)).to.equal("alice.unicorn");
    });

    it("Should emit SubdomainClaimed event", async function () {
      await expect(unicornEcosystem.connect(user1).claimSubdomain("alice"))
        .to.emit(unicornEcosystem, "SubdomainClaimed")
        .withArgs(user1.address, 1n, COMMUNITY_TOKEN_OFFSET + 1n, "alice");
    });

    it("Should reject duplicate names (case insensitive)", async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("alice");

      // Give user2 tokens and approval
      await unicornCredit.teamMint(user2.address, 1);
      await unicornCredit.connect(user2).approve(
        await unicornEcosystem.getAddress(),
        ethers.MaxUint256
      );

      await expect(
        unicornEcosystem.connect(user2).claimSubdomain("ALICE")
      ).to.be.revertedWith("Subdomain already claimed");
    });

    it("Should reject if user has insufficient UCRED", async function () {
      // user2 has no tokens
      await unicornCredit.connect(user2).approve(
        await unicornEcosystem.getAddress(),
        ethers.MaxUint256
      );

      await expect(
        unicornEcosystem.connect(user2).claimSubdomain("bob")
      ).to.be.revertedWith("Insufficient UCRED balance");
    });
  });

  describe("Team Claiming", function () {
    beforeEach(async function () {
      await unicornEcosystem.setTeamMinter(teamMinter.address, true);
      await unicornCredit.teamMint(user2.address, 5);
      await unicornCredit.connect(user2).approve(
        await unicornEcosystem.getAddress(),
        ethers.MaxUint256
      );
    });

    it("Should allow team minter to claim for user", async function () {
      await unicornEcosystem.connect(teamMinter).teamClaimFor(user2.address, "teamuser");
      expect(await unicornEcosystem.ownerOf(1)).to.equal(user2.address);
      expect(await unicornEcosystem.resolveSubdomain("teamuser")).to.equal(user2.address);
    });

    it("Should emit TeamClaimExecuted event", async function () {
      await expect(
        unicornEcosystem.connect(teamMinter).teamClaimFor(user2.address, "teamuser")
      )
        .to.emit(unicornEcosystem, "TeamClaimExecuted")
        .withArgs(teamMinter.address, user2.address, 1n, "teamuser");
    });

    it("Should reject if not authorized", async function () {
      await expect(
        unicornEcosystem.connect(user1).teamClaimFor(user2.address, "teamuser")
      ).to.be.revertedWith("Not authorized to team claim");
    });
  });

  describe("Soulbound Behavior", function () {
    beforeEach(async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("alice");
    });

    it("Should revert on transfer", async function () {
      await expect(
        unicornEcosystem.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("Soulbound: transfers disabled");
    });

    it("Should revert on safeTransferFrom", async function () {
      await expect(
        unicornEcosystem.connect(user1)["safeTransferFrom(address,address,uint256)"](
          user1.address,
          user2.address,
          1
        )
      ).to.be.revertedWith("Soulbound: transfers disabled");
    });

    it("Should revert on approve", async function () {
      await expect(
        unicornEcosystem.connect(user1).approve(user2.address, 1)
      ).to.be.revertedWith("Soulbound: approvals disabled");
    });

    it("Should revert on setApprovalForAll", async function () {
      await expect(
        unicornEcosystem.connect(user1).setApprovalForAll(user2.address, true)
      ).to.be.revertedWith("Soulbound: approvals disabled");
    });
  });

  describe("Token Type Helpers", function () {
    beforeEach(async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("alice");
    });

    it("Should correctly identify subdomain tokens", async function () {
      expect(await unicornEcosystem.isSubdomainToken(1)).to.be.true;
      expect(await unicornEcosystem.isSubdomainToken(COMMUNITY_TOKEN_OFFSET + 1n)).to.be.false;
    });

    it("Should correctly identify community tokens", async function () {
      expect(await unicornEcosystem.isCommunityToken(COMMUNITY_TOKEN_OFFSET + 1n)).to.be.true;
      expect(await unicornEcosystem.isCommunityToken(1)).to.be.false;
    });

    it("Should get community token ID from subdomain ID", async function () {
      expect(await unicornEcosystem.getCommunityTokenId(1)).to.equal(COMMUNITY_TOKEN_OFFSET + 1n);
    });

    it("Should get subdomain token ID from community ID", async function () {
      expect(await unicornEcosystem.getSubdomainTokenId(COMMUNITY_TOKEN_OFFSET + 1n)).to.equal(1n);
    });
  });

  describe("Resolution Functions", function () {
    beforeEach(async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("alice");
    });

    it("Should resolve subdomain to owner", async function () {
      expect(await unicornEcosystem.resolveSubdomain("alice")).to.equal(user1.address);
    });

    it("Should resolve case-insensitively", async function () {
      expect(await unicornEcosystem.resolveSubdomain("ALICE")).to.equal(user1.address);
      expect(await unicornEcosystem.resolveSubdomain("Alice")).to.equal(user1.address);
    });

    it("Should return zero address for unclaimed names", async function () {
      expect(await unicornEcosystem.resolveSubdomain("bob")).to.equal(ethers.ZeroAddress);
    });

    it("Should check name availability", async function () {
      expect(await unicornEcosystem.isNameAvailable("alice")).to.be.false;
      expect(await unicornEcosystem.isNameAvailable("bob")).to.be.true;
      expect(await unicornEcosystem.isNameAvailable("-invalid")).to.be.false;
    });
  });

  describe("Metadata Generation", function () {
    beforeEach(async function () {
      await unicornEcosystem.connect(user1).claimSubdomain("alice");
    });

    it("Should generate subdomain metadata", async function () {
      const tokenURI = await unicornEcosystem.tokenURI(1);
      expect(tokenURI).to.include("data:application/json");
      expect(tokenURI).to.include("alice.unicorn");
      expect(tokenURI).to.include("Subdomain");
    });

    it("Should generate community metadata", async function () {
      const tokenURI = await unicornEcosystem.tokenURI(COMMUNITY_TOKEN_OFFSET + 1n);
      expect(tokenURI).to.include("data:application/json");
      expect(tokenURI).to.include("Community");
      expect(tokenURI).to.include("alice.unicorn");
    });
  });

  describe("Pausable", function () {
    it("Should prevent claiming when paused", async function () {
      await unicornEcosystem.pause();
      await expect(
        unicornEcosystem.connect(user1).claimSubdomain("alice")
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow claiming after unpause", async function () {
      await unicornEcosystem.pause();
      await unicornEcosystem.unpause();
      await unicornEcosystem.connect(user1).claimSubdomain("alice");
      expect(await unicornEcosystem.ownerOf(1)).to.equal(user1.address);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update domain suffix", async function () {
      await unicornEcosystem.setDomainSuffix(".eth");
      await unicornEcosystem.connect(user1).claimSubdomain("alice");
      expect(await unicornEcosystem.getFullDomain(1)).to.equal("alice.eth");
    });

    it("Should allow owner to update image URIs", async function () {
      const newURI = "ipfs://QmNewImage";
      await unicornEcosystem.setBaseSubdomainImageURI(newURI);
      expect(await unicornEcosystem.getBaseSubdomainImageURI()).to.equal(newURI);
    });

    it("Should track total subdomains claimed", async function () {
      expect(await unicornEcosystem.totalSubdomainsClaimed()).to.equal(0);
      await unicornEcosystem.connect(user1).claimSubdomain("alice");
      expect(await unicornEcosystem.totalSubdomainsClaimed()).to.equal(1);
    });
  });
});
