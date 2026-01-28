const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DorkRewards with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Configuration
  const DORK_TOKEN = "0x19Ad44859E7cD7EC6cB1e0eE9853C4a78A3F9AEc";

  // IMPORTANT: Set this to your signing service wallet address
  // This wallet will sign win verifications - keep its private key secure on your backend
  const SIGNER_ADDRESS = process.env.REWARDS_SIGNER || deployer.address;

  console.log("\n--- Deploying DorkRewards ---");
  console.log("DORK Token:", DORK_TOKEN);
  console.log("Signer:", SIGNER_ADDRESS);

  const DorkRewards = await ethers.getContractFactory("DorkRewards");
  const dorkRewards = await DorkRewards.deploy(DORK_TOKEN, SIGNER_ADDRESS);
  await dorkRewards.waitForDeployment();

  const contractAddress = await dorkRewards.getAddress();
  console.log("DorkRewards deployed to:", contractAddress);

  // Verify configuration
  console.log("\n--- Game Rewards ---");
  console.log("Default:", ethers.formatEther(await dorkRewards.defaultRewardAmount()), "DORK");
  console.log("2048:", ethers.formatEther(await dorkRewards.getRewardAmount("2048")), "DORK");
  console.log("Tetris:", ethers.formatEther(await dorkRewards.getRewardAmount("tetris")), "DORK");
  console.log("Higher/Lower:", ethers.formatEther(await dorkRewards.getRewardAmount("higherlower")), "DORK");
  console.log("Snake:", ethers.formatEther(await dorkRewards.getRewardAmount("snake")), "DORK");
  console.log("Memory:", ethers.formatEther(await dorkRewards.getRewardAmount("memory")), "DORK");
  console.log("Blackjack:", ethers.formatEther(await dorkRewards.getRewardAmount("blackjack")), "DORK");

  console.log("\n--- Rate Limits ---");
  console.log("Cooldown:", Number(await dorkRewards.cooldownPeriod()) / 3600, "hours");
  console.log("Daily Limit:", Number(await dorkRewards.dailyClaimLimit()), "claims");

  // Summary
  console.log("\n========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("========================================");
  console.log("Network:", network.name);
  console.log("DorkRewards:", contractAddress);
  console.log("DORK Token:", DORK_TOKEN);
  console.log("Signer:", SIGNER_ADDRESS);
  console.log("========================================");

  console.log("\n--- NEXT STEPS ---");
  console.log("1. Send DORK tokens to the contract:");
  console.log(`   Contract: ${contractAddress}`);
  console.log("");
  console.log("2. Update the frontend with the contract address:");
  console.log("   File: unicorn-games/src/contracts/dorkRewards.ts");
  console.log(`   Set DORK_REWARDS_ADDRESS = '${contractAddress}'`);
  console.log("");
  console.log("3. Set up the signing service with the signer private key");
  console.log("   The signer wallet signs win verifications");
  console.log("");
  console.log("4. Verify the contract:");
  console.log(`   npx hardhat verify --network ${network.name} ${contractAddress} ${DORK_TOKEN} ${SIGNER_ADDRESS}`);

  return contractAddress;
}

main()
  .then((address) => {
    console.log("\nDeployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
