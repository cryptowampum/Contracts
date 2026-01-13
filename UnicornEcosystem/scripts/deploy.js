const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log("");

  // Configuration - Update these before deployment
  const config = {
    // Image URIs (IPFS or other permanent storage)
    baseSubdomainImageURI: "ipfs://QmYourSubdomainImageHash",
    baseCommunityImageURI: "ipfs://QmYourCommunityImageHash",

    // ThirdWeb server wallet address (will be set as team minter)
    thirdwebServerWallet: null, // Set to address string if you want to add one
  };

  // ===== Deploy UnicornCredit (ERC20) =====
  console.log("Deploying UnicornCredit...");
  const UnicornCredit = await ethers.getContractFactory("UnicornCredit");
  const unicornCredit = await UnicornCredit.deploy();
  await unicornCredit.waitForDeployment();
  const unicornCreditAddress = await unicornCredit.getAddress();
  console.log("UnicornCredit deployed to:", unicornCreditAddress);
  console.log("");

  // ===== Deploy UnicornEcosystem (NFTs) =====
  console.log("Deploying UnicornEcosystem...");
  const UnicornEcosystem = await ethers.getContractFactory("UnicornEcosystem");
  const unicornEcosystem = await UnicornEcosystem.deploy(
    unicornCreditAddress,
    config.baseSubdomainImageURI,
    config.baseCommunityImageURI
  );
  await unicornEcosystem.waitForDeployment();
  const unicornEcosystemAddress = await unicornEcosystem.getAddress();
  console.log("UnicornEcosystem deployed to:", unicornEcosystemAddress);
  console.log("");

  // ===== Post-Deployment Setup =====
  console.log("Running post-deployment setup...");

  // Add ThirdWeb server wallet as team minter (if configured)
  if (config.thirdwebServerWallet) {
    console.log("Adding ThirdWeb server wallet as team minter on UnicornCredit...");
    await unicornCredit.setTeamMinter(config.thirdwebServerWallet, true);

    console.log("Adding ThirdWeb server wallet as team minter on UnicornEcosystem...");
    await unicornEcosystem.setTeamMinter(config.thirdwebServerWallet, true);

    console.log("ThirdWeb server wallet added:", config.thirdwebServerWallet);
  }

  console.log("");
  console.log("========================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("========================================");
  console.log("");
  console.log("Contract Addresses:");
  console.log("  UnicornCredit (UCRED):", unicornCreditAddress);
  console.log("  UnicornEcosystem:     ", unicornEcosystemAddress);
  console.log("");
  console.log("Next Steps:");
  console.log("  1. Verify contracts on block explorer");
  console.log("  2. Update image URIs if using placeholders");
  console.log("  3. Add ThirdWeb server wallet as team minter");
  console.log("  4. Test the claim flow on testnet");
  console.log("");
  console.log("Verification Commands:");
  console.log(`  npx hardhat verify --network <network> ${unicornCreditAddress}`);
  console.log(`  npx hardhat verify --network <network> ${unicornEcosystemAddress} "${unicornCreditAddress}" "${config.baseSubdomainImageURI}" "${config.baseCommunityImageURI}"`);
  console.log("");

  return {
    unicornCredit: unicornCreditAddress,
    unicornEcosystem: unicornEcosystemAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
