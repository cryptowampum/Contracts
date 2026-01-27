const { ethers, upgrades, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DorkToken with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Configuration
  const config = {
    serverWallet: "0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c",
    teamMinters: [
      "0x46Ec054Eed3068e908610e1A02D01F5e2a2E3b0b",
      "0x7049747E615a1C5C22935D5790a664B7E65D9681"
    ],
    initialDistribution: {
      contract: 1000,      // 1000 DORK to reward pool
      serverWallet: 100,   // 100 DORK to server wallet
      teamMinter1: 100,    // 100 DORK to first team minter
      teamMinter2: 100     // 100 DORK to second team minter
    },
    // Token metadata URI - points to JSON metadata file
    tokenURI: "ipfs://bafkreibjew45gzuopqgpcwsstaq4qq2d5x2gsxczenv6c3sdm3vuss6tlm"
  };

  // Deploy DorkToken as UUPS proxy
  console.log("\n--- Deploying DorkToken ---");
  const DorkToken = await ethers.getContractFactory("DorkToken");

  const dorkToken = await upgrades.deployProxy(
    DorkToken,
    [deployer.address, config.tokenURI],
    {
      initializer: "initialize",
      kind: "uups",
      redeployImplementation: "always"
    }
  );

  await dorkToken.waitForDeployment();
  const proxyAddress = await dorkToken.getAddress();
  console.log("DorkToken Proxy deployed to:", proxyAddress);

  // Get implementation address
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("DorkToken Implementation:", implAddress);

  // Setup team minters
  console.log("\n--- Setting up team minters ---");

  // Add server wallet as team minter
  let tx = await dorkToken.setTeamMinter(config.serverWallet, true);
  await tx.wait();
  console.log("Added server wallet as team minter:", config.serverWallet);

  // Add other team minters
  for (const minter of config.teamMinters) {
    tx = await dorkToken.setTeamMinter(minter, true);
    await tx.wait();
    console.log("Added team minter:", minter);
  }

  // Initial distribution
  console.log("\n--- Initial distribution ---");

  // Mint to contract's reward pool
  tx = await dorkToken.mintToRewardPool(config.initialDistribution.contract);
  await tx.wait();
  console.log(`Minted ${config.initialDistribution.contract} DORK to reward pool`);

  // Mint to server wallet
  tx = await dorkToken.teamMint(config.serverWallet, config.initialDistribution.serverWallet);
  await tx.wait();
  console.log(`Minted ${config.initialDistribution.serverWallet} DORK to server wallet`);

  // Mint to team minters
  tx = await dorkToken.teamMint(config.teamMinters[0], config.initialDistribution.teamMinter1);
  await tx.wait();
  console.log(`Minted ${config.initialDistribution.teamMinter1} DORK to team minter 1`);

  tx = await dorkToken.teamMint(config.teamMinters[1], config.initialDistribution.teamMinter2);
  await tx.wait();
  console.log(`Minted ${config.initialDistribution.teamMinter2} DORK to team minter 2`);

  // Verify balances
  console.log("\n--- Verifying balances ---");
  const poolBalance = await dorkToken.getRewardPoolBalance();
  console.log("Reward pool balance:", ethers.formatEther(poolBalance), "DORK");

  const serverBalance = await dorkToken.balanceOf(config.serverWallet);
  console.log("Server wallet balance:", ethers.formatEther(serverBalance), "DORK");

  const team1Balance = await dorkToken.balanceOf(config.teamMinters[0]);
  console.log("Team minter 1 balance:", ethers.formatEther(team1Balance), "DORK");

  const team2Balance = await dorkToken.balanceOf(config.teamMinters[1]);
  console.log("Team minter 2 balance:", ethers.formatEther(team2Balance), "DORK");

  const totalSupply = await dorkToken.totalSupply();
  console.log("Total supply:", ethers.formatEther(totalSupply), "DORK");

  // Summary
  console.log("\n========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("========================================");
  console.log("Network:", network.name);
  console.log("DorkToken Proxy:", proxyAddress);
  console.log("DorkToken Implementation:", implAddress);
  console.log("Token URI:", await dorkToken.tokenURI());
  console.log("Mint Price:", ethers.formatEther(await dorkToken.mintPrice()), "ETH");
  console.log("Total Supply:", ethers.formatEther(totalSupply), "DORK");
  console.log("Reward Pool:", ethers.formatEther(poolBalance), "DORK");
  console.log("========================================");

  // Verification command
  console.log("\nTo verify on block explorer:");
  console.log(`npx hardhat verify --network ${network.name} ${implAddress}`);

  return {
    proxy: proxyAddress,
    implementation: implAddress
  };
}

main()
  .then((result) => {
    console.log("\nDeployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
