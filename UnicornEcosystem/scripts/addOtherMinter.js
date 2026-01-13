const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const otherWallet = "0x7049747E615a1C5C22935D5790a664B7E65D9681";

  // Detect network and use correct addresses
  const network = await ethers.provider.getNetwork();
  let creditAddress, ecosystemAddress, chainName;

  if (network.chainId === 42161n) {
    creditAddress = "0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6";
    ecosystemAddress = "0x66d34B2DA878A33D410ceC50598c5004E79256e2";
    chainName = "Arbitrum";
  } else if (network.chainId === 8453n) {
    creditAddress = "0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4";
    ecosystemAddress = "0x440A2e63468384Ff72a84d96B03619cBe580d352";
    chainName = "Base";
  } else {
    console.log("Unknown network:", network.chainId);
    return;
  }

  console.log(`Adding other wallet as team minter on ${chainName}...`);

  const UnicornCredit = await ethers.getContractFactory("UnicornCredit");
  const credit = UnicornCredit.attach(creditAddress);

  const UnicornEcosystem = await ethers.getContractFactory("UnicornEcosystem");
  const ecosystem = UnicornEcosystem.attach(ecosystemAddress);

  // Add to UnicornCredit
  console.log("Adding to UnicornCredit...");
  const tx1 = await credit.setTeamMinter(otherWallet, true);
  await tx1.wait();
  console.log("  Done");

  // Add to UnicornEcosystem
  console.log("Adding to UnicornEcosystem...");
  const tx2 = await ecosystem.setTeamMinter(otherWallet, true);
  await tx2.wait();
  console.log("  Done");

  console.log(`\n${otherWallet} is now a team minter on ${chainName}!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
