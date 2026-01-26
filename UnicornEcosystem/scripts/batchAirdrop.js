const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Batch Airdrop Script for UnicornEcosystemV2
 *
 * Usage:
 *   npx hardhat run scripts/batchAirdrop.js --network base
 *   npx hardhat run scripts/batchAirdrop.js --network arbitrum
 *
 * Input file format (CSV):
 *   wallet,subdomain
 *   0x1234...,alice.community.unicorn
 *   0x5678...,bob.community.unicorn
 *
 * Or JSON:
 *   [
 *     { "wallet": "0x1234...", "subdomain": "alice.community.unicorn" },
 *     { "wallet": "0x5678...", "subdomain": "bob.community.unicorn" }
 *   ]
 */

const MAX_BATCH_SIZE = 50;

async function main() {
  const [deployer] = await ethers.getSigners();

  // Detect network and use correct proxy address
  const network = await ethers.provider.getNetwork();
  let proxyAddress, chainName;

  if (network.chainId === 42161n) {
    proxyAddress = "0x4927FF835C17495bf209740d1912987445A6dee6";
    chainName = "Arbitrum";
  } else if (network.chainId === 8453n) {
    proxyAddress = "0xe83eCe78EB0be0721fF47389Ff674aBaC7E4E58d";
    chainName = "Base";
  } else {
    console.log("Unknown network:", network.chainId);
    return;
  }

  // Load input file
  const inputPath = process.env.AIRDROP_FILE || "./airdrop-data.csv";

  if (!fs.existsSync(inputPath)) {
    console.log(`Input file not found: ${inputPath}`);
    console.log("");
    console.log("Create a CSV file with format:");
    console.log("  wallet,subdomain");
    console.log("  0x1234...,alice.community.unicorn");
    console.log("");
    console.log("Or JSON file:");
    console.log('  [{ "wallet": "0x1234...", "subdomain": "alice" }]');
    console.log("");
    console.log("Set AIRDROP_FILE env var or create ./airdrop-data.csv");
    return;
  }

  const fileContent = fs.readFileSync(inputPath, "utf8");
  let records = [];

  // Parse CSV or JSON
  if (inputPath.endsWith(".json")) {
    records = JSON.parse(fileContent);
  } else {
    // CSV parsing
    const lines = fileContent.trim().split("\n");
    const header = lines[0].toLowerCase();

    // Skip header if present
    const startLine = header.includes("wallet") ? 1 : 0;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",").map(p => p.trim());
      if (parts.length >= 2) {
        records.push({
          wallet: parts[0],
          subdomain: parts[1]
        });
      }
    }
  }

  console.log(`Batch Airdrop on ${chainName}`);
  console.log("=====================================");
  console.log("Proxy:", proxyAddress);
  console.log("Deployer:", deployer.address);
  console.log("Records to process:", records.length);
  console.log("");

  // Validate records
  const validRecords = [];
  const invalidRecords = [];

  for (const record of records) {
    if (!ethers.isAddress(record.wallet)) {
      invalidRecords.push({ ...record, error: "Invalid wallet address" });
      continue;
    }
    if (!record.subdomain || record.subdomain.length === 0) {
      invalidRecords.push({ ...record, error: "Empty subdomain" });
      continue;
    }
    validRecords.push(record);
  }

  if (invalidRecords.length > 0) {
    console.log(`WARNING: ${invalidRecords.length} invalid records skipped:`);
    invalidRecords.forEach(r => console.log(`  ${r.wallet}: ${r.error}`));
    console.log("");
  }

  if (validRecords.length === 0) {
    console.log("No valid records to process.");
    return;
  }

  // Connect to contract
  const UnicornEcosystemV2 = await ethers.getContractFactory("UnicornEcosystemV2");
  const ecosystem = UnicornEcosystemV2.attach(proxyAddress);

  // Check if deployer is team minter
  const isMinter = await ecosystem.teamMinters(deployer.address);
  if (!isMinter) {
    console.log("ERROR: Deployer is not a team minter!");
    return;
  }

  // Check which names are available
  console.log("Checking name availability...");
  const availableRecords = [];
  const unavailableRecords = [];

  for (const record of validRecords) {
    const isAvailable = await ecosystem.isNameAvailable(record.subdomain);
    if (isAvailable) {
      availableRecords.push(record);
    } else {
      unavailableRecords.push({ ...record, error: "Name already taken" });
    }
  }

  if (unavailableRecords.length > 0) {
    console.log(`WARNING: ${unavailableRecords.length} names already taken:`);
    unavailableRecords.forEach(r => console.log(`  ${r.subdomain}`));
    console.log("");
  }

  if (availableRecords.length === 0) {
    console.log("No available names to airdrop.");
    return;
  }

  console.log(`Ready to airdrop ${availableRecords.length} NFTs`);
  console.log("");

  // Process in batches
  const batches = [];
  for (let i = 0; i < availableRecords.length; i += MAX_BATCH_SIZE) {
    batches.push(availableRecords.slice(i, i + MAX_BATCH_SIZE));
  }

  console.log(`Processing ${batches.length} batches...`);
  console.log("");

  let totalMinted = 0;
  const results = [];

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const recipients = batch.map(r => r.wallet);
    const names = batch.map(r => r.subdomain);

    console.log(`Batch ${batchIndex + 1}/${batches.length}: ${batch.length} records...`);

    try {
      const tx = await ecosystem.teamAirdropBatch(recipients, names);
      console.log(`  TX: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`  Confirmed in block ${receipt.blockNumber}`);

      totalMinted += batch.length;
      batch.forEach(r => results.push({ ...r, status: "success", tx: tx.hash }));
    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
      batch.forEach(r => results.push({ ...r, status: "failed", error: error.message }));

      // If batch fails, try individual airdrops
      console.log("  Retrying individually...");
      for (const record of batch) {
        try {
          const tx = await ecosystem.teamAirdrop(record.wallet, record.subdomain);
          await tx.wait();
          totalMinted++;
          results[results.length - batch.length + batch.indexOf(record)] = { ...record, status: "success", tx: tx.hash };
          console.log(`    ${record.subdomain}: OK`);
        } catch (e) {
          console.log(`    ${record.subdomain}: FAILED - ${e.message}`);
        }
      }
    }

    // Small delay between batches
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log("");
  console.log("=====================================");
  console.log("AIRDROP COMPLETE");
  console.log("=====================================");
  console.log(`Total minted: ${totalMinted}/${availableRecords.length}`);
  console.log("");

  // Save results
  const outputPath = inputPath.replace(/\.[^.]+$/, "-results.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${outputPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
