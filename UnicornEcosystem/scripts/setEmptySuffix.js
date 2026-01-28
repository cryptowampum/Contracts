const { ethers, network } = require("hardhat");

async function main() {
  let proxyAddress;

  if (network.name === "base") {
    proxyAddress = "0xe83eCe78EB0be0721fF47389Ff674aBaC7E4E58d";
  } else if (network.name === "arbitrum") {
    proxyAddress = "0x4927FF835C17495bf209740d1912987445A6dee6";
  } else {
    console.error("Use --network base or --network arbitrum");
    process.exit(1);
  }

  console.log(`Setting domain suffix on ${network.name}...`);

  const ecosystem = await ethers.getContractAt("UnicornEcosystemV2", proxyAddress);

  const [signer] = await ethers.getSigners();
  const owner = await ecosystem.owner();
  console.log("Contract owner:", owner);
  console.log("Signer:", signer.address);
  console.log("Is owner:", owner.toLowerCase() === signer.address.toLowerCase());
  console.log("Current suffix:", JSON.stringify(await ecosystem.domainSuffix()));

  console.log("Sending transaction...");
  const tx = await ecosystem.setDomainSuffix(".");
  console.log("Tx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Tx confirmed, status:", receipt.status);

  console.log("New suffix:", JSON.stringify(await ecosystem.domainSuffix()));

  // Verify with getFullDomain
  const fullDomain = await ecosystem.getFullDomain(1);
  console.log("getFullDomain(1) now returns:", fullDomain);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
