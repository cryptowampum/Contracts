const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Detect network and use correct addresses
  const network = await ethers.provider.getNetwork();
  let creditAddress, chainName;

  if (network.chainId === 42161n) {
    creditAddress = "0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6";
    chainName = "Arbitrum";
  } else if (network.chainId === 8453n) {
    creditAddress = "0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4";
    chainName = "Base";
  } else {
    console.log("Unknown network:", network.chainId);
    return;
  }

  const serverWallet = "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c";
  const totalToMint = 500;
  const batchSize = 100;

  console.log(`Minting ${totalToMint} UCRED on ${chainName}...`);
  console.log("To:", serverWallet);
  console.log("Credit contract:", creditAddress);
  console.log("");

  const UnicornCredit = await ethers.getContractFactory("UnicornCredit");
  const credit = UnicornCredit.attach(creditAddress);

  // Check current balance
  const balanceBefore = await credit.balanceOf(serverWallet);
  console.log("Balance before:", ethers.formatEther(balanceBefore), "UCRED");

  // Mint in batches of 100
  const batches = Math.ceil(totalToMint / batchSize);
  for (let i = 0; i < batches; i++) {
    const amount = Math.min(batchSize, totalToMint - (i * batchSize));
    console.log(`Minting batch ${i + 1}/${batches}: ${amount} UCRED...`);
    const tx = await credit.teamMint(serverWallet, amount);
    await tx.wait();
    console.log(`  Done (tx: ${tx.hash})`);
  }

  // Check new balance
  const balanceAfter = await credit.balanceOf(serverWallet);
  console.log("");
  console.log("Balance after:", ethers.formatEther(balanceAfter), "UCRED");
  console.log("Minted:", ethers.formatEther(balanceAfter - balanceBefore), "UCRED");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
