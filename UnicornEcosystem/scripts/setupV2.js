const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Detect network and use correct proxy address
  const network = await ethers.provider.getNetwork();
  let proxyAddress, chainName;

  if (network.chainId === 42161n) {
    proxyAddress = "0x4927FF835C17495bf209740d1912987445A6dee6";
    chainName = "Arbitrum";
  } else if (network.chainId === 8453n) {
    proxyAddress = "0xe83eCe78EB0be0721fF47389Ff674aBaC7E4E58d";
    chainName = "Base";
  } else {
    console.log("Unknown network:", network.chainId);
    return;
  }

  const serverWallet = "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c";
  const otherWallet = "0x7049747E615a1C5C22935D5790a664B7E65D9681";

  console.log(`Setting up UnicornEcosystemV2 on ${chainName}...`);
  console.log("Proxy address:", proxyAddress);
  console.log("");

  const UnicornEcosystemV2 = await ethers.getContractFactory("UnicornEcosystemV2");
  const ecosystem = UnicornEcosystemV2.attach(proxyAddress);

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

  // Verify version
  const version = await ecosystem.version();
  console.log("");
  console.log("Contract version:", version);
  console.log("Setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
