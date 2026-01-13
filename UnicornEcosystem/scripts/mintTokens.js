const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Minting tokens with account:", deployer.address);

  const creditAddress = "0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4";
  const serverWallet = "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c";
  const otherWallet = "0x7049747E615a1C5C22935D5790a664B7E65D9681";

  const UnicornCredit = await ethers.getContractFactory("UnicornCredit");
  const credit = UnicornCredit.attach(creditAddress);

  // Mint 300 UCRED to server wallet (in batches of 100)
  console.log("Minting 300 UCRED to server wallet (3 batches of 100)...");

  const tx1a = await credit.teamMint(serverWallet, 100);
  await tx1a.wait();
  console.log("Batch 1: Minted 100 UCRED");

  const tx1b = await credit.teamMint(serverWallet, 100);
  await tx1b.wait();
  console.log("Batch 2: Minted 100 UCRED");

  const tx1c = await credit.teamMint(serverWallet, 100);
  await tx1c.wait();
  console.log("Batch 3: Minted 100 UCRED");

  console.log("Total 300 UCRED minted to:", serverWallet);

  // Mint 1 UCRED to other wallet
  console.log("Minting 1 UCRED to other wallet...");
  const tx2 = await credit.teamMint(otherWallet, 1);
  await tx2.wait();
  console.log("Minted 1 UCRED to:", otherWallet);

  // Check balances
  const serverBalance = await credit.balanceOf(serverWallet);
  const otherBalance = await credit.balanceOf(otherWallet);

  console.log("\nBalances:");
  console.log("  Server wallet:", ethers.formatEther(serverBalance), "UCRED");
  console.log("  Other wallet:", ethers.formatEther(otherBalance), "UCRED");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
