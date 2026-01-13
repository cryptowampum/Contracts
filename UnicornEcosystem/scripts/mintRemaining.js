const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Minting remaining tokens with account:", deployer.address);

  const creditAddress = "0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4";
  const serverWallet = "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c";
  const otherWallet = "0x7049747E615a1C5C22935D5790a664B7E65D9681";

  const UnicornCredit = await ethers.getContractFactory("UnicornCredit");
  const credit = UnicornCredit.attach(creditAddress);

  // Check current balance
  let serverBalance = await credit.balanceOf(serverWallet);
  console.log("Server wallet current balance:", ethers.formatEther(serverBalance), "UCRED");

  // Mint 100 more to server wallet
  console.log("Minting 100 UCRED to server wallet...");
  const tx1 = await credit.teamMint(serverWallet, 100);
  await tx1.wait();
  console.log("Minted 100 UCRED");

  // Mint another 100 to server wallet
  console.log("Minting 100 more UCRED to server wallet...");
  const tx2 = await credit.teamMint(serverWallet, 100);
  await tx2.wait();
  console.log("Minted 100 UCRED");

  // Mint 1 UCRED to other wallet
  console.log("Minting 1 UCRED to other wallet...");
  const tx3 = await credit.teamMint(otherWallet, 1);
  await tx3.wait();
  console.log("Minted 1 UCRED to:", otherWallet);

  // Check final balances
  serverBalance = await credit.balanceOf(serverWallet);
  const otherBalance = await credit.balanceOf(otherWallet);

  console.log("\nFinal Balances:");
  console.log("  Server wallet:", ethers.formatEther(serverBalance), "UCRED");
  console.log("  Other wallet:", ethers.formatEther(otherBalance), "UCRED");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
