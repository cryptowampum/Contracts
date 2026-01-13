const { ethers } = require("hardhat");

async function main() {
  const otherWallet = "0x7049747E615a1C5C22935D5790a664B7E65D9681";
  const ecosystemAddress = "0x440A2e63468384Ff72a84d96B03619cBe580d352";

  console.log("Adding other wallet to Base UnicornEcosystem...");

  const UnicornEcosystem = await ethers.getContractFactory("UnicornEcosystem");
  const ecosystem = UnicornEcosystem.attach(ecosystemAddress);

  const tx = await ecosystem.setTeamMinter(otherWallet, true);
  await tx.wait();

  console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
