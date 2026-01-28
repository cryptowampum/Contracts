const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Get the correct proxy address based on network
  let proxyAddress;
  let chainName;

  if (network.name === "base") {
    proxyAddress = "0xe83eCe78EB0be0721fF47389Ff674aBaC7E4E58d";
    chainName = "Base";
  } else if (network.name === "arbitrum") {
    proxyAddress = "0x4927FF835C17495bf209740d1912987445A6dee6";
    chainName = "Arbitrum";
  } else {
    console.error("Unsupported network. Use --network base or --network arbitrum");
    process.exit(1);
  }

  console.log(`\nUsing UnicornEcosystemV2 on ${chainName}: ${proxyAddress}`);

  // Connect to the contract
  const UnicornEcosystemV2 = await ethers.getContractFactory("UnicornEcosystemV2");
  const ecosystem = UnicornEcosystemV2.attach(proxyAddress);

  // Test domain
  const testDomain = "foo.bar.xyz";
  const testRecipient = deployer.address; // Mint to deployer for testing

  // Check if name is available
  console.log(`\nChecking if "${testDomain}" is available...`);
  const isAvailable = await ecosystem.isNameAvailable(testDomain);
  console.log(`Name available: ${isAvailable}`);

  if (!isAvailable) {
    // Check who owns it
    const owner = await ecosystem.resolveSubdomain(testDomain);
    console.log(`Name already owned by: ${owner}`);
    process.exit(0);
  }

  // Mint the NFT
  console.log(`\nMinting "${testDomain}" to ${testRecipient}...`);
  const tx = await ecosystem.teamAirdrop(testRecipient, testDomain);
  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);

  // Verify the mint
  console.log("\n--- Verification ---");
  const newOwner = await ecosystem.resolveSubdomain(testDomain);
  console.log(`Owner of "${testDomain}":`, newOwner);

  const fullDomain = await ecosystem.getFullDomain(1); // Assuming token ID 1
  console.log("Full domain:", fullDomain);

  console.log("\nTest complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
