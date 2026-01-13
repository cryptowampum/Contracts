const { ethers } = require("hardhat");

async function main() {
  const serverWallet = "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c";
  const otherWallet = "0x7049747E615a1C5C22935D5790a664B7E65D9681";

  // Detect network and use correct addresses
  const network = await ethers.provider.getNetwork();
  let creditAddress, ecosystemAddress, chainName;

  if (network.chainId === 42161n) {
    // Arbitrum
    creditAddress = "0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6";
    ecosystemAddress = "0x66d34B2DA878A33D410ceC50598c5004E79256e2";
    chainName = "Arbitrum";
  } else if (network.chainId === 8453n) {
    // Base
    creditAddress = "0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4";
    ecosystemAddress = "0x440A2e63468384Ff72a84d96B03619cBe580d352";
    chainName = "Base";
  } else {
    console.log("Unknown network:", network.chainId);
    return;
  }

  console.log(`Checking team minters on ${chainName}...\n`);

  const UnicornCredit = await ethers.getContractFactory("UnicornCredit");
  const credit = UnicornCredit.attach(creditAddress);

  const UnicornEcosystem = await ethers.getContractFactory("UnicornEcosystem");
  const ecosystem = UnicornEcosystem.attach(ecosystemAddress);

  // Check UnicornCredit
  const serverMinterCredit = await credit.teamMinters(serverWallet);
  const otherMinterCredit = await credit.teamMinters(otherWallet);

  // Check UnicornEcosystem
  const serverMinterEcosystem = await ecosystem.teamMinters(serverWallet);
  const otherMinterEcosystem = await ecosystem.teamMinters(otherWallet);

  console.log("UnicornCredit Team Minters:");
  console.log(`  Server (${serverWallet.slice(0,6)}...): ${serverMinterCredit ? "YES" : "NO"}`);
  console.log(`  Other  (${otherWallet.slice(0,6)}...): ${otherMinterCredit ? "YES" : "NO"}`);

  console.log("\nUnicornEcosystem Team Minters:");
  console.log(`  Server (${serverWallet.slice(0,6)}...): ${serverMinterEcosystem ? "YES" : "NO"}`);
  console.log(`  Other  (${otherWallet.slice(0,6)}...): ${otherMinterEcosystem ? "YES" : "NO"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
