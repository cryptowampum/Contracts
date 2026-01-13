const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Updating image URIs with account:", deployer.address);

  // UnicornEcosystem contract address on Base mainnet
  const ecosystemAddress = "0x440A2e63468384Ff72a84d96B03619cBe580d352";

  // New IPFS URIs
  const subdomainImageURI = "ipfs://bafkreidtgzztbjue3yamvkd7rdh2hxlsbchd3bclc53s37nvgys2f6s4y4";
  const communityImageURI = "ipfs://bafkreid4j2yawdwm4ogi63rbzxjmnh4cdx2ljyhuip36gdgmhhl7cjdxiu";

  // Get contract instance
  const UnicornEcosystem = await ethers.getContractFactory("UnicornEcosystem");
  const ecosystem = UnicornEcosystem.attach(ecosystemAddress);

  // Update subdomain image URI
  console.log("Updating subdomain image URI...");
  const tx1 = await ecosystem.setBaseSubdomainImageURI(subdomainImageURI);
  await tx1.wait();
  console.log("Subdomain image URI updated:", subdomainImageURI);

  // Update community image URI
  console.log("Updating community image URI...");
  const tx2 = await ecosystem.setBaseCommunityImageURI(communityImageURI);
  await tx2.wait();
  console.log("Community image URI updated:", communityImageURI);

  console.log("\nImage URIs updated successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
