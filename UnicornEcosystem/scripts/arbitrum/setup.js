const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting up Arbitrum deployment with account:", deployer.address);

  // Arbitrum contract addresses
  const creditAddress = "0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6";
  const ecosystemAddress = "0x66d34B2DA878A33D410ceC50598c5004E79256e2";

  // Configuration
  const subdomainImageURI = "ipfs://bafkreidtgzztbjue3yamvkd7rdh2hxlsbchd3bclc53s37nvgys2f6s4y4";
  const communityImageURI = "ipfs://bafkreid4j2yawdwm4ogi63rbzxjmnh4cdx2ljyhuip36gdgmhhl7cjdxiu";
  const serverWallet = "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c";
  const otherWallet = "0x7049747E615a1C5C22935D5790a664B7E65D9681";

  // Get contract instances
  const UnicornCredit = await ethers.getContractFactory("UnicornCredit");
  const credit = UnicornCredit.attach(creditAddress);

  const UnicornEcosystem = await ethers.getContractFactory("UnicornEcosystem");
  const ecosystem = UnicornEcosystem.attach(ecosystemAddress);

  // 1. Update image URIs
  console.log("\n1. Updating image URIs...");
  const tx1 = await ecosystem.setBaseSubdomainImageURI(subdomainImageURI);
  await tx1.wait();
  console.log("   Subdomain image URI set");

  const tx2 = await ecosystem.setBaseCommunityImageURI(communityImageURI);
  await tx2.wait();
  console.log("   Community image URI set");

  // 2. Add team minter on both contracts
  console.log("\n2. Adding ThirdWeb server wallet as team minter...");
  const tx3 = await credit.setTeamMinter(serverWallet, true);
  await tx3.wait();
  console.log("   Added to UnicornCredit");

  const tx4 = await ecosystem.setTeamMinter(serverWallet, true);
  await tx4.wait();
  console.log("   Added to UnicornEcosystem");

  // 3. Mint tokens
  console.log("\n3. Minting UCRED tokens...");

  // Mint 300 to server wallet (3 batches of 100)
  console.log("   Minting 300 UCRED to server wallet...");
  const tx5a = await credit.teamMint(serverWallet, 100);
  await tx5a.wait();
  console.log("   Batch 1/3 complete");

  const tx5b = await credit.teamMint(serverWallet, 100);
  await tx5b.wait();
  console.log("   Batch 2/3 complete");

  const tx5c = await credit.teamMint(serverWallet, 100);
  await tx5c.wait();
  console.log("   Batch 3/3 complete");

  // Mint 1 to other wallet
  const tx6 = await credit.teamMint(otherWallet, 1);
  await tx6.wait();
  console.log("   Minted 1 UCRED to other wallet");

  // 4. Verify final state
  console.log("\n4. Final balances:");
  const serverBalance = await credit.balanceOf(serverWallet);
  const otherBalance = await credit.balanceOf(otherWallet);
  const totalSupply = await credit.totalSupply();

  console.log("   Server wallet:", ethers.formatEther(serverBalance), "UCRED");
  console.log("   Other wallet:", ethers.formatEther(otherBalance), "UCRED");
  console.log("   Total supply:", ethers.formatEther(totalSupply), "UCRED");

  console.log("\n========================================");
  console.log("ARBITRUM SETUP COMPLETE");
  console.log("========================================");
  console.log("\nContract Addresses:");
  console.log("  UnicornCredit:", creditAddress);
  console.log("  UnicornEcosystem:", ecosystemAddress);
  console.log("\nConfiguration:");
  console.log("  ThirdWeb Server Wallet:", serverWallet);
  console.log("  Subdomain Image:", subdomainImageURI);
  console.log("  Community Image:", communityImageURI);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
