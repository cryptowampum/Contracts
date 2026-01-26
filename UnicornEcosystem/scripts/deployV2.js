const { ethers, upgrades } = require("hardhat");

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

  console.log(`Deploying UnicornEcosystemV2 on ${chainName}...`);
  console.log("Deployer:", deployer.address);
  console.log("Using UnicornCredit:", creditAddress);
  console.log("");

  // Deploy UnicornEcosystemV2 as upgradeable proxy
  console.log("Deploying UnicornEcosystemV2 (UUPS Proxy)...");
  const UnicornEcosystemV2 = await ethers.getContractFactory("UnicornEcosystemV2");
  const unicornEcosystem = await upgrades.deployProxy(
    UnicornEcosystemV2,
    [creditAddress, config.baseSubdomainImageURI, config.baseCommunityImageURI],
    { initializer: "initialize", kind: "uups", redeployImplementation: "always" }
  );
  await unicornEcosystem.waitForDeployment();

  const proxyAddress = await unicornEcosystem.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("Proxy deployed to:", proxyAddress);
  console.log("Implementation deployed to:", implementationAddress);
  console.log("");

  // Setup team minters
  console.log("Setting up team minters...");

  console.log("Adding server wallet as team minter...");
  const tx1 = await unicornEcosystem.setTeamMinter(config.serverWallet, true);
  await tx1.wait();
  console.log("  Server wallet added:", config.serverWallet);

  console.log("Adding other wallet as team minter...");
  const tx2 = await unicornEcosystem.setTeamMinter(config.otherWallet, true);
  await tx2.wait();
  console.log("  Other wallet added:", config.otherWallet);

  console.log("");
  console.log("========================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("========================================");
  console.log("");
  console.log(`Chain: ${chainName}`);
  console.log("UnicornCredit:", creditAddress);
  console.log("UnicornEcosystemV2 (Proxy):", proxyAddress);
  console.log("UnicornEcosystemV2 (Implementation):", implementationAddress);
  console.log("");
  console.log("New Features:");
  console.log("  - teamAirdrop(recipient, name) - Mint NFTs without UCRED");
  console.log("  - teamAirdropBatch(recipients[], names[]) - Batch airdrop");
  console.log("  - clawback(tokenId) - Take back NFT from any wallet");
  console.log("  - clawbackBatch(tokenIds[]) - Batch clawback");
  console.log("  - Upgradeable via UUPS proxy");
  console.log("");
  console.log("Verification Commands:");
  console.log(`  npx hardhat verify --network ${chainName.toLowerCase()} ${implementationAddress}`);
  console.log("");

  return {
    proxy: proxyAddress,
    implementation: implementationAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
