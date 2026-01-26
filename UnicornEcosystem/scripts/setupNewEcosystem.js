const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Detect network and use correct addresses
  const network = await ethers.provider.getNetwork();
  let ecosystemAddress, chainName;

  if (network.chainId === 42161n) {
    ecosystemAddress = "REPLACE_WITH_NEW_ARBITRUM_ADDRESS";
    chainName = "Arbitrum";
  } else if (network.chainId === 8453n) {
    ecosystemAddress = "0x16eb245684D55818B46D7B9164Afc98518a90215";
    chainName = "Base";
  } else {
    console.log("Unknown network:", network.chainId);
    return;
  }

  const serverWallet = "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c";
  const otherWallet = "0x7049747E615a1C5C22935D5790a664B7E65D9681";

  console.log(`Setting up UnicornEcosystem on ${chainName}...`);
  console.log("Ecosystem address:", ecosystemAddress);
  console.log("");

  const UnicornEcosystem = await ethers.getContractFactory("UnicornEcosystem");
  const ecosystem = UnicornEcosystem.attach(ecosystemAddress);

  // Check current status
  const serverIsMinter = await ecosystem.teamMinters(serverWallet);
  const otherIsMinter = await ecosystem.teamMinters(otherWallet);

  console.log("Current status:");
  console.log(`  Server wallet minter: ${serverIsMinter ? "YES" : "NO"}`);
  console.log(`  Other wallet minter: ${otherIsMinter ? "YES" : "NO"}`);
  console.log("");

  if (!serverIsMinter) {
    console.log("Adding server wallet as team minter...");
    const tx1 = await ecosystem.setTeamMinter(serverWallet, true);
    await tx1.wait();
    console.log("  Done");
  }

  if (!otherIsMinter) {
    console.log("Adding other wallet as team minter...");
    const tx2 = await ecosystem.setTeamMinter(otherWallet, true);
    await tx2.wait();
    console.log("  Done");
  }

  console.log("");
  console.log("Setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
