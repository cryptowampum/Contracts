const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Detect network and use correct addresses
  const network = await ethers.provider.getNetwork();
  let creditAddress, chainName;

  if (network.chainId === 42161n) {
    creditAddress = "0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6";
    chainName = "Arbitrum";
  } else if (network.chainId === 8453n) {
    creditAddress = "0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4";
    chainName = "Base";
  } else {
    console.log("Unknown network:", network.chainId);
    return;
  }

  // Configuration
  const config = {
    baseSubdomainImageURI: "ipfs://bafkreidtgzztbjue3yamvkd7rdh2hxlsbchd3bclc53s37nvgys2f6s4y4",
    baseCommunityImageURI: "ipfs://bafkreid4j2yawdwm4ogi63rbzxjmnh4cdx2ljyhuip36gdgmhhl7cjdxiu",
    serverWallet: "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c",
    otherWallet: "0x7049747E615a1C5C22935D5790a664B7E65D9681",
  };

  console.log(`Upgrading UnicornEcosystem on ${chainName}...`);
  console.log("Deployer:", deployer.address);
  console.log("Using existing UnicornCredit:", creditAddress);
  console.log("");

  // ===== Deploy NEW UnicornEcosystem =====
  console.log("Deploying new UnicornEcosystem...");
  const UnicornEcosystem = await ethers.getContractFactory("UnicornEcosystem");
  const unicornEcosystem = await UnicornEcosystem.deploy(
    creditAddress,
    config.baseSubdomainImageURI,
    config.baseCommunityImageURI
  );
  await unicornEcosystem.waitForDeployment();
  const ecosystemAddress = await unicornEcosystem.getAddress();
  console.log("New UnicornEcosystem deployed to:", ecosystemAddress);
  console.log("");

  // ===== Post-Deployment Setup =====
  console.log("Running post-deployment setup...");

  // Add server wallet as team minter
  console.log("Adding server wallet as team minter...");
  const tx1 = await unicornEcosystem.setTeamMinter(config.serverWallet, true);
  await tx1.wait();
  console.log("  Server wallet added:", config.serverWallet);

  // Add other wallet as team minter
  console.log("Adding other wallet as team minter...");
  const tx2 = await unicornEcosystem.setTeamMinter(config.otherWallet, true);
  await tx2.wait();
  console.log("  Other wallet added:", config.otherWallet);

  console.log("");
  console.log("========================================");
  console.log("UPGRADE COMPLETE");
  console.log("========================================");
  console.log("");
  console.log(`Chain: ${chainName}`);
  console.log("UnicornCredit (unchanged):", creditAddress);
  console.log("NEW UnicornEcosystem:     ", ecosystemAddress);
  console.log("");
  console.log("Changes in this version:");
  console.log("  - MAX_NAME_LENGTH increased from 32 to 128");
  console.log("  - Dots (.) now allowed in subdomain names");
  console.log("");
  console.log("Verification Command:");
  console.log(`  npx hardhat verify --network ${chainName.toLowerCase()} ${ecosystemAddress} "${creditAddress}" "${config.baseSubdomainImageURI}" "${config.baseCommunityImageURI}"`);
  console.log("");

  return ecosystemAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
