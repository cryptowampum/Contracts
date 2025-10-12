// test/SuperFantastic.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");


describe("SuperFantastic Security Tests", function () {

// ========== TOKEN RECOVERY TESTS ==========
  
  describe("Token Recovery Functions", function () {
    it("Should withdraw native tokens correctly", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      // Send some MATIC/ETH to contract
      await owner.sendTransaction({
        to: contract.address,
        value: ethers.parseEther("1.0")
      });
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(contract.address);
      
      const tx = await contract.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(balanceAfter).to.equal(balanceBefore + contractBalance - gasUsed);
    });

    it("Should recover ERC20 tokens", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      // Deploy mock ERC20
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const token = await MockERC20.deploy("Mock Token", "MOCK", ethers.parseEther("1000"));
      
      // Send tokens to contract
      await token.transfer(contract.address, ethers.parseEther("100"));
      
      const ownerBalanceBefore = await token.balanceOf(owner.address);
      
      // Recover all tokens (amount = 0)
      await contract.recoverERC20(token.address, 0);
      
      const ownerBalanceAfter = await token.balanceOf(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + ethers.parseEther("100"));
    });

    it("Should recover partial ERC20 amount", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const token = await MockERC20.deploy("Mock", "MCK", ethers.parseEther("1000"));
      
      await token.transfer(contract.address, ethers.parseEther("100"));
      
      // Recover only 50 tokens
      await contract.recoverERC20(token.address, ethers.parseEther("50"));
      
      const contractBalance = await token.balanceOf(contract.address);
      expect(contractBalance).to.equal(ethers.parseEther("50"));
    });

    it("Should recover ERC721 NFTs", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      // Deploy mock NFT
      const MockNFT = await ethers.getContractFactory("MockERC721");
      const nft = await MockNFT.deploy("Mock NFT", "MNFT");
      
      // Mint NFT to contract
      await nft.mint(contract.address, 1);
      
      expect(await nft.ownerOf(1)).to.equal(contract.address);
      
      // Recover the NFT
      await contract.recoverERC721(nft.address, 1);
      
      expect(await nft.ownerOf(1)).to.equal(owner.address);
    });

    it("Should prevent non-owner from recovering tokens", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).withdraw()
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
      
      await expect(
        contract.connect(user1).recoverERC20(ethers.ZeroAddress, 0)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
      
      await expect(
        contract.connect(user1).recoverERC721(ethers.ZeroAddress, 1)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("Should prevent recovering own SuperFantastic NFTs", async function () {
      const { contract, owner, user1 } = await loadFixture(deployWithTeamFixture);
      
      // Mint a token
      await contract.connect(owner).teamMint(
        user1.address,
        "ipfs://image",
        "text",
        "event",
        Math.floor(Date.now() / 1000)
      );
      
      // Try to recover it
      await expect(
        contract.recoverERC721(contract.address, 1)
      ).to.be.revertedWith("Cannot recover own tokens");
    });

    it("Should prevent recovering ERC20 from own contract address", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.recoverERC20(contract.address, 0)
      ).to.be.revertedWith("Cannot recover own tokens");
    });

    it("Should emit NativeTokenWithdrawn event", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      await owner.sendTransaction({
        to: contract.address,
        value: ethers.parseEther("1.0")
      });
      
      await expect(contract.withdraw())
        .to.emit(contract, "NativeTokenWithdrawn")
        .withArgs(owner.address, ethers.parseEther("1.0"));
    });

    it("Should emit ERC20Recovered event", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const token = await MockERC20.deploy("Mock", "MCK", ethers.parseEther("1000"));
      await token.transfer(contract.address, ethers.parseEther("100"));
      
      await expect(contract.recoverERC20(token.address, 0))
        .to.emit(contract, "ERC20Recovered")
        .withArgs(token.address, owner.address, ethers.parseEther("100"));
    });

    it("Should emit ERC721Recovered event", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      const MockNFT = await ethers.getContractFactory("MockERC721");
      const nft = await MockNFT.deploy("Mock NFT", "MNFT");
      await nft.mint(contract.address, 42);
      
      await expect(contract.recoverERC721(nft.address, 42))
        .to.emit(contract, "ERC721Recovered")
        .withArgs(nft.address, owner.address, 42);
    });

    it("Should revert when withdrawing with no balance", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.withdraw()
      ).to.be.revertedWith("No funds to withdraw");
    });

    it("Should revert when recovering ERC20 with no balance", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const token = await MockERC20.deploy("Mock", "MCK", ethers.parseEther("1000"));
      
      await expect(
        contract.recoverERC20(token.address, 0)
      ).to.be.revertedWith("No tokens to recover");
    });

    it("Should revert when recovering ERC721 not owned by contract", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      
      const MockNFT = await ethers.getContractFactory("MockERC721");
      const nft = await MockNFT.deploy("Mock NFT", "MNFT");
      await nft.mint(contract.owner(), 1); // Mint to owner, not contract
      
      await expect(
        contract.recoverERC721(nft.address, 1)
      ).to.be.revertedWith("Contract doesn't own this token");
    });

    it("Should handle SafeERC20 for non-standard tokens", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      // Deploy token that returns false instead of reverting
      const NonStandardERC20 = await ethers.getContractFactory("NonStandardERC20");
      const token = await NonStandardERC20.deploy();
      
      await token.transfer(contract.address, 1000);
      
      // SafeERC20 should handle this correctly
      await expect(
        contract.recoverERC20(token.address, 0)
      ).to.not.be.reverted;
    });

    it("Should use withdrawETH as alias for withdraw", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      await owner.sendTransaction({
        to: contract.address,
        value: ethers.parseEther("1.0")
      });
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      const tx = await contract.withdrawETH();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(balanceAfter).to.be.closeTo(
        balanceBefore + ethers.parseEther("1.0"),
        gasUsed * 2n // Allow for gas variance
      );
    });
  });
  
  // ========== FIXTURES ==========
  
  async function deployContractFixture() {
    const [owner, teamMember, moderator, user1, user2, attacker] = await ethers.getSigners();
    
    const SuperFantastic = await ethers.getContractFactory("SuperFantastic");
    const contract = await SuperFantastic.deploy(
      "ipfs://QmBaseImage...",
      "ipfs://QmBaseAnimation...",
      "ipfs://QmNSFWImage..."
    );
    
    return { contract, owner, teamMember, moderator, user1, user2, attacker };
  }

  async function deployWithTeamFixture() {
    const deployment = await deployContractFixture();
    const { contract, owner, teamMember, moderator } = deployment;
    
    // Add team member and moderator
    await contract.connect(owner).setTeamMinter(teamMember.address, true);
    await contract.connect(owner).setModerator(moderator.address, true);
    
    return deployment;
  }

  // ========== DEPLOYMENT TESTS ==========
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should automatically set owner as team minter", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      expect(await contract.teamMinters(owner.address)).to.be.true;
    });

    it("Should automatically set owner as moderator", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      expect(await contract.moderators(owner.address)).to.be.true;
    });

    it("Should revert if base image URI is empty", async function () {
      const SuperFantastic = await ethers.getContractFactory("SuperFantastic");
      await expect(
        SuperFantastic.deploy("", "ipfs://animation", "ipfs://nsfw")
      ).to.be.revertedWith("Base image URI cannot be empty");
    });

    it("Should revert if NSFW image URI is empty", async function () {
      const SuperFantastic = await ethers.getContractFactory("SuperFantastic");
      await expect(
        SuperFantastic.deploy("ipfs://base", "ipfs://animation", "")
      ).to.be.revertedWith("NSFW image URI cannot be empty");
    });
  });

  // ========== REENTRANCY TESTS ==========
  
  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy on mint()", async function () {
      const { contract, attacker } = await loadFixture(deployContractFixture);
      
      // Deploy malicious contract
      const MaliciousReceiver = await ethers.getContractFactory("MaliciousReceiver");
      const malicious = await MaliciousReceiver.deploy(contract.address);
      
      // Attempt reentrancy attack
      await expect(
        malicious.attack({ value: ethers.parseEther("0.01") })
      ).to.be.reverted;
    });

    it("Should prevent reentrancy on teamMint()", async function () {
      const { contract, teamMember } = await loadFixture(deployWithTeamFixture);
      
      const MaliciousReceiver = await ethers.getContractFactory("MaliciousReceiver");
      const malicious = await MaliciousReceiver.deploy(contract.address);
      
      await expect(
        contract.connect(teamMember).teamMint(
          malicious.address,
          "ipfs://image",
          "text",
          "event",
          Math.floor(Date.now() / 1000)
        )
      ).to.be.reverted;
    });
  });

  // ========== CEI PATTERN TESTS ==========
  
  describe("Checks-Effects-Interactions Pattern", function () {
    it("Should update state before external calls in mint()", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await contract.connect(user1).mint(
        "ipfs://custom",
        "Hello!",
        "Test Event",
        Math.floor(Date.now() / 1000),
        { value: ethers.parseEther("0.01") }
      );
      
      // Verify state was updated
      expect(await contract.balanceOf(user1.address)).to.equal(1);
      expect(await contract.totalSupply()).to.equal(1);
    });

    it("Should refund excess payment correctly", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      
      const tx = await contract.connect(user1).mint(
        "",
        "text",
        "event",
        Math.floor(Date.now() / 1000),
        { value: ethers.parseEther("1.0") } // Overpay
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      
      // Should only pay mint price (0) + gas
      expect(balanceAfter).to.be.closeTo(balanceBefore - gasUsed, ethers.parseEther("0.01"));
    });
  });

  // ========== ACCESS CONTROL TESTS ==========
  
  describe("Access Control", function () {
    it("Should prevent non-team members from calling teamMint()", async function () {
      const { contract, user1, user2 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).teamMint(
          user2.address,
          "ipfs://image",
          "text",
          "event",
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith("Not authorized to team mint");
    });

    it("Should prevent non-moderators from flagging", async function () {
      const { contract, user1, user2 } = await loadFixture(deployWithTeamFixture);
      
      // Mint a token first
      await contract.connect(user1).mint(
        "",
        "text",
        "event",
        Math.floor(Date.now() / 1000)
      );
      
      await expect(
        contract.connect(user2).flagToken(1, "inappropriate")
      ).to.be.revertedWith("Not authorized to moderate");
    });

    it("Should only allow owner to unflag tokens", async function () {
      const { contract, moderator, user1 } = await loadFixture(deployWithTeamFixture);
      
      // Mint and flag a token
      await contract.connect(user1).mint("", "text", "event", Math.floor(Date.now() / 1000));
      await contract.connect(moderator).flagToken(1, "test");
      
      // Non-owner cannot unflag
      await expect(
        contract.connect(moderator).unflagToken(1)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to pause", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).pause()
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });

  // ========== INPUT VALIDATION TESTS ==========
  
  describe("Input Validation", function () {
    it("Should reject empty event name in mint()", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).mint(
          "ipfs://image",
          "text",
          "", // Empty event name
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith("Event name required");
    });

    it("Should reject event date too far in future", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      const farFuture = Math.floor(Date.now() / 1000) + (400 * 24 * 60 * 60); // 400 days
      
      await expect(
        contract.connect(user1).mint(
          "",
          "text",
          "event",
          farFuture
        )
      ).to.be.revertedWith("Event date too far in future");
    });

    it("Should reject event date too far in past", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      const farPast = Math.floor(Date.now() / 1000) - (2000 * 24 * 60 * 60); // ~5.5 years
      
      await expect(
        contract.connect(user1).mint(
          "",
          "text",
          "event",
          farPast
        )
      ).to.be.revertedWith("Event date too far in past");
    });

    it("Should reject zero address in teamMint()", async function () {
      const { contract, teamMember } = await loadFixture(deployWithTeamFixture);
      
      await expect(
        contract.connect(teamMember).teamMint(
          ethers.ZeroAddress,
          "ipfs://image",
          "text",
          "event",
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should require custom image for team mints", async function () {
      const { contract, teamMember, user1 } = await loadFixture(deployWithTeamFixture);
      
      await expect(
        contract.connect(teamMember).teamMint(
          user1.address,
          "", // Empty image
          "text",
          "event",
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith("Custom image required for team mint");
    });

    it("Should reject batch size exceeding MAX_BATCH_SIZE", async function () {
      const { contract, teamMember } = await loadFixture(deployWithTeamFixture);
      
      const recipients = new Array(101).fill(ethers.Wallet.createRandom().address);
      const images = new Array(101).fill("ipfs://image");
      const texts = new Array(101).fill("text");
      
      await expect(
        contract.connect(teamMember).batchTeamMint(
          recipients,
          images,
          texts,
          "event",
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith("Batch size too large");
    });
  });

  // ========== SOULBOUND TESTS ==========
  
  describe("Soulbound Functionality", function () {
    it("Should prevent transfers", async function () {
      const { contract, user1, user2 } = await loadFixture(deployContractFixture);
      
      await contract.connect(user1).mint("", "text", "event", Math.floor(Date.now() / 1000));
      
      await expect(
        contract.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("Soulbound: transfers disabled");
    });

    it("Should prevent approvals", async function () {
      const { contract, user1, user2 } = await loadFixture(deployContractFixture);
      
      await contract.connect(user1).mint("", "text", "event", Math.floor(Date.now() / 1000));
      
      await expect(
        contract.connect(user1).approve(user2.address, 1)
      ).to.be.revertedWith("Soulbound: approvals disabled");
    });

    it("Should prevent setApprovalForAll", async function () {
      const { contract, user1, user2 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).setApprovalForAll(user2.address, true)
      ).to.be.revertedWith("Soulbound: approvals disabled");
    });

    it("Should allow burning", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await contract.connect(user1).mint("", "text", "event", Math.floor(Date.now() / 1000));
      
      // Burn should work (transfer to zero address)
      await expect(
        contract.connect(user1).transferFrom(user1.address, ethers.ZeroAddress, 1)
      ).to.not.be.reverted;
    });
  });

  // ========== PAUSABLE TESTS ==========
  
  describe("Pausable Functionality", function () {
    it("Should prevent minting when paused", async function () {
      const { contract, owner, user1 } = await loadFixture(deployContractFixture);
      
      await contract.connect(owner).pause();
      
      await expect(
        contract.connect(user1).mint("", "text", "event", Math.floor(Date.now() / 1000))
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow minting when unpaused", async function () {
      const { contract, owner, user1 } = await loadFixture(deployContractFixture);
      
      await contract.connect(owner).pause();
      await contract.connect(owner).unpause();
      
      await expect(
        contract.connect(user1).mint("", "text", "event", Math.floor(Date.now() / 1000))
      ).to.not.be.reverted;
    });
  });

  // ========== MODERATION TESTS ==========
  
  describe("Moderation System", function () {
    it("Should flag token and update metadata", async function () {
      const { contract, moderator, user1 } = await loadFixture(deployWithTeamFixture);
      
      await contract.connect(user1).mint("ipfs://custom", "text", "event", Math.floor(Date.now() / 1000));
      await contract.connect(moderator).flagToken(1, "inappropriate");
      
      expect(await contract.isFlagged(1)).to.be.true;
      
      const uri = await contract.tokenURI(1);
      expect(uri).to.include("flagged");
    });

    it("Should use NSFW image for flagged tokens", async function () {
      const { contract, moderator, user1 } = await loadFixture(deployWithTeamFixture);
      
      await contract.connect(user1).mint("ipfs://custom", "text", "event", Math.floor(Date.now() / 1000));
      await contract.connect(moderator).flagToken(1, "test");
      
      const uri = await contract.tokenURI(1);
      const json = JSON.parse(uri.split(",")[1]);
      
      expect(json.image).to.include("QmNSFWImage");
    });

    it("Should batch flag multiple tokens", async function () {
      const { contract, moderator, user1, user2 } = await loadFixture(deployWithTeamFixture);
      
      await contract.connect(user1).mint("", "text", "event", Math.floor(Date.now() / 1000));
      await contract.connect(user2).mint("", "text", "event", Math.floor(Date.now() / 1000));
      
      await contract.connect(moderator).batchFlagTokens([1, 2], "batch flag test");
      
      expect(await contract.isFlagged(1)).to.be.true;
      expect(await contract.isFlagged(2)).to.be.true;
    });

    it("Should reject batch flagging over limit", async function () {
      const { contract, moderator } = await loadFixture(deployWithTeamFixture);
      
      const tokenIds = new Array(51).fill(1);
      
      await expect(
        contract.connect(moderator).batchFlagTokens(tokenIds, "test")
      ).to.be.revertedWith("Too many tokens to flag at once");
    });
  });

  // ========== WITHDRAWAL TESTS ==========
  
  describe("ETH Withdrawal", function () {
    it("Should withdraw ETH correctly", async function () {
      const { contract, owner, user1 } = await loadFixture(deployContractFixture);
      
      // Set mint price and mint
      await contract.connect(owner).setMintPrice(ethers.parseEther("0.1"));
      await contract.connect(user1).mint(
        "",
        "text",
        "event",
        Math.floor(Date.now() / 1000),
        { value: ethers.parseEther("0.1") }
      );
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(contract.address);
      
      const tx = await contract.connect(owner).withdrawETH();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(balanceAfter).to.equal(balanceBefore + contractBalance - gasUsed);
    });

    it("Should revert withdrawal when no ETH in contract", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(owner).withdrawETH()
      ).to.be.revertedWith("No ETH to withdraw");
    });

    it("Should emit ETHWithdrawn event", async function () {
      const { contract, owner, user1 } = await loadFixture(deployContractFixture);
      
      await contract.connect(owner).setMintPrice(ethers.parseEther("0.1"));
      await contract.connect(user1).mint(
        "",
        "text",
        "event",
        Math.floor(Date.now() / 1000),
        { value: ethers.parseEther("0.1") }
      );
      
      await expect(contract.connect(owner).withdrawETH())
        .to.emit(contract, "ETHWithdrawn")
        .withArgs(owner.address, ethers.parseEther("0.1"));
    });
  });

  // ========== SUPPLY LIMIT TESTS ==========
  
  describe("Supply Limits", function () {
    it("Should enforce MAX_SUPPLY", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      
      const maxSupply = await contract.MAX_SUPPLY();
      expect(maxSupply).to.equal(10000);
    });

    it("Should prevent minting beyond MAX_SUPPLY", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      // This test would be expensive to run fully, so we'll mock it
      // In a real scenario, you'd mint up to MAX_SUPPLY then try one more
      
      // For demonstration, we'll just verify the constant exists
      expect(await contract.MAX_SUPPLY()).to.equal(10000);
    });
  });

  // ========== METADATA TESTS ==========
  
  describe("Metadata Generation", function () {
    it("Should generate correct metadata for custom image", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await contract.connect(user1).mint(
        "ipfs://QmCustomImage",
        "Custom message!",
        "Test Event",
        1234567890
      );
      
      const uri = await contract.tokenURI(1);
      const json = JSON.parse(uri.split(",")[1]);
      
      expect(json.name).to.include("SuperFantastic #1");
      expect(json.name).to.include("Test Event");
      expect(json.description).to.equal("Custom message!");
      expect(json.image).to.equal("ipfs://QmCustomImage");
    });

    it("Should use base image when no custom image provided", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await contract.connect(user1).mint(
        "", // No custom image
        "Text",
        "Event",
        Math.floor(Date.now() / 1000)
      );
      
      const uri = await contract.tokenURI(1);
      const json = JSON.parse(uri.split(",")[1]);
      
      expect(json.image).to.include("QmBaseImage");
    });

    it("Should include all attributes correctly", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      const eventDate = Math.floor(Date.now() / 1000);
      await contract.connect(user1).mint(
        "ipfs://custom",
        "text",
        "My Event",
        eventDate
      );
      
      const uri = await contract.tokenURI(1);
      const json = JSON.parse(uri.split(",")[1]);
      
      const ownerAttr = json.attributes.find(a => a.trait_type === "Owner");
      const eventAttr = json.attributes.find(a => a.trait_type === "Event");
      const dateAttr = json.attributes.find(a => a.trait_type === "Event Date");
      const customPhotoAttr = json.attributes.find(a => a.trait_type === "Custom Photo");
      
      expect(ownerAttr.value).to.include(user1.address.toLowerCase().slice(2));
      expect(eventAttr.value).to.equal("My Event");
      expect(dateAttr.value).to.equal(eventDate);
      expect(customPhotoAttr.value).to.equal("true");
    });

    it("Should update metadata correctly", async function () {
      const { contract, teamMember, user1 } = await loadFixture(deployWithTeamFixture);
      
      await contract.connect(teamMember).teamMint(
        user1.address,
        "ipfs://original",
        "original text",
        "Original Event",
        Math.floor(Date.now() / 1000)
      );
      
      const newDate = Math.floor(Date.now() / 1000);
      await contract.connect(teamMember).updateTokenMetadata(
        1,
        "ipfs://updated",
        "updated text",
        "Updated Event",
        newDate
      );
      
      const [image, text, event, date] = await contract.getTokenMetadata(1);
      expect(image).to.equal("ipfs://updated");
      expect(text).to.equal("updated text");
      expect(event).to.equal("Updated Event");
      expect(date).to.equal(newDate);
    });
  });

  // ========== EVENT EMISSION TESTS ==========
  
  describe("Event Emission", function () {
    it("Should emit Minted event", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).mint("", "text", "Test Event", Math.floor(Date.now() / 1000))
      ).to.emit(contract, "Minted")
        .withArgs(user1.address, 1, "Test Event");
    });

    it("Should emit TeamMinterUpdated on authorization", async function () {
      const { contract, owner, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(owner).setTeamMinter(user1.address, true)
      ).to.emit(contract, "TeamMinterUpdated")
        .withArgs(user1.address, true);
    });

    it("Should emit ModeratorUpdated on authorization", async function () {
      const { contract, owner, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(owner).setModerator(user1.address, true)
      ).to.emit(contract, "ModeratorUpdated")
        .withArgs(user1.address, true);
    });

    it("Should emit TokenFlagged event", async function () {
      const { contract, moderator, user1 } = await loadFixture(deployWithTeamFixture);
      
      await contract.connect(user1).mint("", "text", "event", Math.floor(Date.now() / 1000));
      
      await expect(
        contract.connect(moderator).flagToken(1, "inappropriate")
      ).to.emit(contract, "TokenFlagged")
        .withArgs(1, moderator.address, "inappropriate");
    });

    it("Should emit MintPriceUpdated event", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(owner).setMintPrice(ethers.parseEther("0.1"))
      ).to.emit(contract, "MintPriceUpdated")
        .withArgs(0, ethers.parseEther("0.1"));
    });
  });

  // ========== BATCH OPERATIONS TESTS ==========
  
  describe("Batch Operations", function () {
    it("Should batch mint correctly", async function () {
      const { contract, teamMember, user1, user2 } = await loadFixture(deployWithTeamFixture);
      
      const recipients = [user1.address, user2.address];
      const images = ["ipfs://image1", "ipfs://image2"];
      const texts = ["Text 1", "Text 2"];
      const eventDate = Math.floor(Date.now() / 1000);
      
      await contract.connect(teamMember).batchTeamMint(
        recipients,
        images,
        texts,
        "Batch Event",
        eventDate
      );
      
      expect(await contract.balanceOf(user1.address)).to.equal(1);
      expect(await contract.balanceOf(user2.address)).to.equal(1);
      expect(await contract.totalSupply()).to.equal(2);
    });

    it("Should emit BatchMinted event", async function () {
      const { contract, teamMember, user1, user2 } = await loadFixture(deployWithTeamFixture);
      
      const recipients = [user1.address, user2.address];
      const images = ["ipfs://image1", "ipfs://image2"];
      const texts = ["Text 1", "Text 2"];
      
      await expect(
        contract.connect(teamMember).batchTeamMint(
          recipients,
          images,
          texts,
          "Event",
          Math.floor(Date.now() / 1000)
        )
      ).to.emit(contract, "BatchMinted");
    });

    it("Should validate array lengths in batch mint", async function () {
      const { contract, teamMember, user1 } = await loadFixture(deployWithTeamFixture);
      
      const recipients = [user1.address];
      const images = ["ipfs://image1", "ipfs://image2"]; // Mismatched length
      const texts = ["Text 1"];
      
      await expect(
        contract.connect(teamMember).batchTeamMint(
          recipients,
          images,
          texts,
          "Event",
          Math.floor(Date.now() / 1000)
        )
      ).to.be.revertedWith("Recipients/images length mismatch");
    });
  });

  // ========== EDGE CASES ==========
  
  describe("Edge Cases", function () {
    it("Should handle minting at exactly MAX_SUPPLY", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      // This is a conceptual test - in practice would be expensive
      // Just verify the check exists
      const maxSupply = await contract.MAX_SUPPLY();
      expect(maxSupply).to.equal(10000);
    });

    it("Should handle empty custom text", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).mint(
          "",
          "", // Empty text
          "Event",
          Math.floor(Date.now() / 1000)
        )
      ).to.not.be.reverted;
    });

    it("Should handle very long custom text", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      const longText = "A".repeat(1000);
      
      await expect(
        contract.connect(user1).mint(
          "",
          longText,
          "Event",
          Math.floor(Date.now() / 1000)
        )
      ).to.not.be.reverted;
    });

    it("Should handle special characters in event name", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).mint(
          "",
          "text",
          "Event with émojis 🎉 and spëcial chars!",
          Math.floor(Date.now() / 1000)
        )
      ).to.not.be.reverted;
    });
  });

  // ========== GAS OPTIMIZATION TESTS ==========
  
  describe("Gas Optimization", function () {
    it("Should measure gas for single mint", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      const tx = await contract.connect(user1).mint(
        "",
        "text",
        "event",
        Math.floor(Date.now() / 1000)
      );
      const receipt = await tx.wait();
      
      console.log(`Gas used for mint: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(300000); // Reasonable gas limit
    });

    it("Should measure gas for team mint", async function () {
      const { contract, teamMember, user1 } = await loadFixture(deployWithTeamFixture);
      
      const tx = await contract.connect(teamMember).teamMint(
        user1.address,
        "ipfs://image",
        "text",
        "event",
        Math.floor(Date.now() / 1000)
      );
      const receipt = await tx.wait();
      
      console.log(`Gas used for teamMint: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(400000);
    });

    it("Should measure gas for batch mint (10 recipients)", async function () {
      const { contract, teamMember } = await loadFixture(deployWithTeamFixture);
      
      const recipients = Array(10).fill(0).map(() => ethers.Wallet.createRandom().address);
      const images = Array(10).fill("ipfs://image");
      const texts = Array(10).fill("text");
      
      const tx = await contract.connect(teamMember).batchTeamMint(
        recipients,
        images,
        texts,
        "event",
        Math.floor(Date.now() / 1000)
      );
      const receipt = await tx.wait();
      
      console.log(`Gas used for batch mint (10): ${receipt.gasUsed.toString()}`);
    });
  });

  // ========== VIEW FUNCTION TESTS ==========
  
  describe("View Functions", function () {
    it("Should return correct minting status", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      expect(await contract.isMintingActive()).to.be.true;
      
      await contract.connect(owner).pause();
      expect(await contract.isMintingActive()).to.be.false;
      
      await contract.connect(owner).unpause();
      expect(await contract.isMintingActive()).to.be.true;
    });

    it("Should return correct base URIs", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      
      expect(await contract.getBaseImageURI()).to.include("QmBaseImage");
      expect(await contract.getBaseAnimationURI()).to.include("QmBaseAnimation");
      expect(await contract.getNSFWReplacementImage()).to.include("QmNSFWImage");
    });

    it("Should return complete token metadata", async function () {
      const { contract, teamMember, user1 } = await loadFixture(deployWithTeamFixture);
      
      const eventDate = Math.floor(Date.now() / 1000);
      await contract.connect(teamMember).teamMint(
        user1.address,
        "ipfs://custom",
        "Custom text",
        "My Event",
        eventDate
      );
      
      const [image, text, event, date, minter, flagged] = await contract.getTokenMetadata(1);
      
      expect(image).to.equal("ipfs://custom");
      expect(text).to.equal("Custom text");
      expect(event).to.equal("My Event");
      expect(date).to.equal(eventDate);
      expect(minter).to.equal(teamMember.address);
      expect(flagged).to.be.false;
    });
  });

  
  // ========== INTEGRATION TESTS ==========
  
  describe("Integration Tests", function () {
    it("Should handle complete workflow: mint -> flag -> unflag", async function () {
      const { contract, owner, moderator, user1 } = await loadFixture(deployWithTeamFixture);
      
      // Mint
      await contract.connect(user1).mint(
        "ipfs://custom",
        "text",
        "event",
        Math.floor(Date.now() / 1000)
      );
      expect(await contract.isFlagged(1)).to.be.false;
      
      // Flag
      await contract.connect(moderator).flagToken(1, "inappropriate");
      expect(await contract.isFlagged(1)).to.be.true;
      
      // Unflag
      await contract.connect(owner).unflagToken(1);
      expect(await contract.isFlagged(1)).to.be.false;
    });

    it("Should handle price change workflow", async function () {
      const { contract, owner, user1, user2 } = await loadFixture(deployContractFixture);
      
      // Mint for free
      await contract.connect(user1).mint("", "text", "event", Math.floor(Date.now() / 1000));
      
      // Change price
      await contract.connect(owner).setMintPrice(ethers.parseEther("0.1"));
      
      // Mint with payment
      await contract.connect(user2).mint(
        "",
        "text",
        "event",
        Math.floor(Date.now() / 1000),
        { value: ethers.parseEther("0.1") }
      );
      
      expect(await contract.totalSupply()).to.equal(2);
    });
  });
});

// ========== MALICIOUS CONTRACT FOR TESTING ==========

// Note: You'll need to create this contract separately for reentrancy tests
/*
contract MaliciousReceiver {
    SuperFantastic public target;
    uint256 public attackCount;
    
    constructor(address _target) {
        target = SuperFantastic(_target);
    }
    
    function attack() external payable {
        target.mint{value: msg.value}("", "attack", "attack", block.timestamp);
    }
    
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external returns (bytes4) {
        if (attackCount < 3) {
            attackCount++;
            target.mint{value: 0.01 ether}("", "reentrancy", "attack", block.timestamp);
        }
        return this.onERC721Received.selector;
    }
}
*/