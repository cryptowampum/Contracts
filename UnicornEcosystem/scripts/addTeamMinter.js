const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Adding team minter with account:", deployer.address);

  // Contract addresses on Base mainnet
  const creditAddress = "0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4";
  const ecosystemAddress = "0x440A2e63468384Ff72a84d96B03619cBe580d352";

  // ThirdWeb server wallet
  const thirdwebWallet = "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c";

  // Get contract instances
  const UnicornCredit = await ethers.getContractFactory("UnicornCredit");
  const credit = UnicornCredit.attach(creditAddress);

  const UnicornEcosystem = await ethers.getContractFactory("UnicornEcosystem");
  const ecosystem = UnicornEcosystem.attach(ecosystemAddress);

  // Add team minter on UnicornCredit
  console.log("Adding team minter on UnicornCredit...");
  const tx1 = await credit.setTeamMinter(thirdwebWallet, true);
  await tx1.wait();
  console.log("Added to UnicornCredit:", thirdwebWallet);

  // Add team minter on UnicornEcosystem
  console.log("Adding team minter on UnicornEcosystem...");
  const tx2 = await ecosystem.setTeamMinter(thirdwebWallet, true);
  await tx2.wait();
  console.log("Added to UnicornEcosystem:", thirdwebWallet);

  console.log("\nThirdWeb server wallet added as team minter on both contracts!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
