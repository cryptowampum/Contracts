const { ethers } = require("hardhat");

async function main() {
  const creditAddress = "0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4";
  const serverWallet = "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c";
  const otherWallet = "0x7049747E615a1C5C22935D5790a664B7E65D9681";

  const UnicornCredit = await ethers.getContractFactory("UnicornCredit");
  const credit = UnicornCredit.attach(creditAddress);

  const serverBalance = await credit.balanceOf(serverWallet);
  const otherBalance = await credit.balanceOf(otherWallet);
  const totalSupply = await credit.totalSupply();

  console.log("UCRED Balances:");
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
