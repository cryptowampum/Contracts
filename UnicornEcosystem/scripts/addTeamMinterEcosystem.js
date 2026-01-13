const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Adding team minter with account:", deployer.address);

  const ecosystemAddress = "0x440A2e63468384Ff72a84d96B03619cBe580d352";
  const thirdwebWallet = "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c";

  const UnicornEcosystem = await ethers.getContractFactory("UnicornEcosystem");
  const ecosystem = UnicornEcosystem.attach(ecosystemAddress);

  console.log("Adding team minter on UnicornEcosystem...");
  const tx = await ecosystem.setTeamMinter(thirdwebWallet, true);
  await tx.wait();
  console.log("Added to UnicornEcosystem:", thirdwebWallet);

  console.log("\nDone!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
