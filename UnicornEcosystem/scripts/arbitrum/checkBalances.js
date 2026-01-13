const { ethers } = require("hardhat");

async function main() {
  // Arbitrum addresses
  const creditAddress = "0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6";
  const serverWallet = "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c";
  const otherWallet = "0x7049747E615a1C5C22935D5790a664B7E65D9681";

  const UnicornCredit = await ethers.getContractFactory("UnicornCredit");
  const credit = UnicornCredit.attach(creditAddress);

  const serverBalance = await credit.balanceOf(serverWallet);
  const otherBalance = await credit.balanceOf(otherWallet);
  const totalSupply = await credit.totalSupply();

  console.log("Arbitrum UCRED Balances:");
  console.log("  Server wallet:", ethers.formatEther(serverBalance), "UCRED");
  console.log("  Other wallet:", ethers.formatEther(otherBalance), "UCRED");
  console.log("  Total supply:", ethers.formatEther(totalSupply), "UCRED");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
