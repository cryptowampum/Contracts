# 🔓 SuperFantastic Token Recovery Guide

## 🎯 Overview

Smart contracts can receive tokens in many ways, but without proper recovery functions, those tokens get **permanently stuck**. This guide explains how to safely recover accidentally sent tokens.

---

## 💰 Types of Tokens You Might Receive

### 1. Native Tokens (ETH/MATIC/BNB/etc)
**How they arrive:**
```javascript
// From mint fees (expected)
await contract.mint(..., { value: mintPrice });

// Accidental direct send
await wallet.sendTransaction({
  to: contractAddress,
  value: ethers.parseEther("1.0")
});
```

**How to recover:**
```javascript
// ✅ Use withdraw() or withdrawETH()
await contract.withdraw();
```

---

### 2. ERC20 Tokens (USDC, USDT, DAI, etc)
**How they arrive:**
```javascript
// Someone accidentally sends USDC
await usdcContract.transfer(contractAddress, 1000000); // 1 USDC

// Someone approves then transfers
await daiContract.transferFrom(sender, contractAddress, amount);
```

**How to recover:**
```javascript
// ✅ Use recoverERC20()
await contract.recoverERC20(
  "0xUSDC_ADDRESS",  // Token contract address
  0                  // 0 = recover all, or specify amount
);
```

---

### 3. ERC721 NFTs (Other Collections)
**How they arrive:**
```javascript
// Someone sends their BAYC to your contract
await baycContract.transferFrom(
  owner,
  contractAddress,
  tokenId
);

// Someone uses safeTransferFrom
await nftContract.safeTransferFrom(
  owner,
  contractAddress,
  tokenId
);
```

**How to recover:**
```javascript
// ✅ Use recoverERC721()
await contract.recoverERC721(
  "0xBAYC_ADDRESS",  // NFT contract address
  tokenId            // Specific token ID
);
```

---

## 🔧 Recovery Functions Explained

### 1. `withdraw()` - Native Token Recovery

```solidity
/// @notice Withdraw all native tokens (ETH/MATIC/etc)
function withdraw() external onlyOwner nonReentrant {
    uint256 balance = address(this).balance;
    require(balance > 0, "No funds to withdraw");
    
    (bool success, ) = payable(owner()).call{value: balance}("");
    require(success, "Withdrawal failed");
    
    emit NativeTokenWithdrawn(owner(), balance);
}
```

**Usage:**
```javascript
// Check balance first
const balance = await ethers.provider.getBalance(contractAddress);
console.log(`Contract has ${ethers.formatEther(balance)} MATIC`);

// Withdraw all
await contract.withdraw();
```

---

### 2. `recoverERC20()` - ERC20 Token Recovery

```solidity
/// @notice Recover ERC20 tokens accidentally sent to contract
/// @param tokenAddress Address of the ERC20 token contract
/// @param amount Amount to recover (0 = recover all)
function recoverERC20(address tokenAddress, uint256 amount) 
    external 
    onlyOwner 
    nonReentrant 
{
    require(tokenAddress != address(0), "Invalid token address");
    
    IERC20 token = IERC20(tokenAddress);
    uint256 contractBalance = token.balanceOf(address(this));
    require(contractBalance > 0, "No tokens to recover");
    
    uint256 amountToRecover = amount == 0 ? contractBalance : amount;
    require(amountToRecover <= contractBalance, "Insufficient token balance");
    
    bool success = token.transfer(owner(), amountToRecover);
    require(success, "Token transfer failed");
    
    emit ERC20Recovered(tokenAddress, owner(), amountToRecover);
}
```

**Usage:**
```javascript
// Example: Recover USDC
const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Polygon USDC

// Check how much USDC is in contract
const usdcContract = await ethers.getContractAt("IERC20", USDC);
const balance = await usdcContract.balanceOf(contractAddress);
console.log(`Contract has ${balance / 1e6} USDC`);

// Recover all USDC
await contract.recoverERC20(USDC, 0);

// Or recover specific amount (1000 USDC with 6 decimals)
await contract.recoverERC20(USDC, 1000 * 1e6);
```

---

### 3. `recoverERC721()` - NFT Recovery

```solidity
/// @notice Recover ERC721 NFTs accidentally sent to contract
/// @param tokenAddress Address of the ERC721 contract
/// @param tokenId Token ID to recover
function recoverERC721(address tokenAddress, uint256 tokenId) 
    external 
    onlyOwner 
    nonReentrant 
{
    require(tokenAddress != address(0), "Invalid token address");
    require(tokenAddress != address(this), "Cannot recover own tokens");
    
    IERC721 token = IERC721(tokenAddress);
    require(token.ownerOf(tokenId) == address(this), "Contract doesn't own this token");
    
    token.safeTransferFrom(address(this), owner(), tokenId);
    
    emit ERC721Recovered(tokenAddress, owner(), tokenId);
}
```

**Usage:**
```javascript
// Example: Someone accidentally sent BAYC #1234
const BAYC = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
const tokenId = 1234;

// Verify contract owns it
const nftContract = await ethers.getContractAt("IERC721", BAYC);
const owner = await nftContract.ownerOf(tokenId);
console.log(`Token owner: ${owner}`);

// Recover the NFT
await contract.recoverERC721(BAYC, tokenId);
```

---

## 🚨 Common Scenarios & Solutions

### Scenario 1: User Sent USDC Instead of Paying in MATIC

**What Happened:**
```javascript
// User confused and sent 100 USDC to contract
await usdcContract.transfer(contractAddress, 100e6);
```

**Solution:**
```javascript
// 1. Verify the tokens are there
const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const usdcContract = await ethers.getContractAt("IERC20", USDC);
const balance = await usdcContract.balanceOf(contractAddress);
console.log(`Found ${balance / 1e6} USDC`);

// 2. Recover the tokens
await contract.recoverERC20(USDC, 0);

// 3. Return to user manually
await usdcContract.transfer(userAddress, balance);
```

---

### Scenario 2: Someone Sent a Random NFT

**What Happened:**
```javascript
// Random person sent their NFT (spam or accident)
await randomNFT.safeTransferFrom(sender, contractAddress, 42);
```

**Solution:**
```javascript
// 1. Check what NFT it is
const nftContract = await ethers.getContractAt("IERC721", nftAddress);
const owner = await nftContract.ownerOf(42);
console.log(`NFT owner: ${owner}`); // Should be your contract

// 2. Recover it
await contract.recoverERC721(nftAddress, 42);

// 3. Decide what to do:
// - Return to sender if it was valuable and accidental
// - Ignore if it's spam
// - Sell if it has value and was abandoned
```

---

### Scenario 3: Multiple Different Tokens Accumulated

**What Happened:**
Over time, various tokens ended up in contract:
- 50 USDC
- 100 DAI  
- 0.5 WETH
- 2 random NFTs

**Solution:**
```javascript
// Script to recover all tokens
async function recoverAllTokens() {
  const tokens = [
    { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", name: "USDC" },
    { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", name: "DAI" },
    { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", name: "WETH" }
  ];
  
  for (const token of tokens) {
    const tokenContract = await ethers.getContractAt("IERC20", token.address);
    const balance = await tokenContract.balanceOf(contractAddress);
    
    if (balance > 0) {
      console.log(`Recovering ${balance} ${token.name}`);
      await contract.recoverERC20(token.address, 0);
    }
  }
  
  // Recover NFTs (need to know addresses and token IDs)
  const nfts = [
    { contract: "0xNFT1...", tokenId: 123 },
    { contract: "0xNFT2...", tokenId: 456 }
  ];
  
  for (const nft of nfts) {
    await contract.recoverERC721(nft.contract, nft.tokenId);
    console.log(`Recovered NFT ${nft.tokenId} from ${nft.contract}`);
  }
}
```

---

## 🛡️ Security Features

### 1. Owner-Only Access
```solidity
modifier onlyOwner() {
    require(msg.sender == owner(), "Only owner can call");
    _;
}
```
**Benefit:** Only contract owner can recover tokens, preventing theft.

### 2. Reentrancy Protection
```solidity
modifier nonReentrant() {
    // Prevents reentrancy attacks
    _;
}
```
**Benefit:** Safe from reentrancy exploits during token transfers.

### 3. Cannot Recover Own Tokens
```solidity
require(tokenAddress != address(this), "Cannot recover own tokens");
```
**Benefit:** Prevents owner from stealing user NFTs from the collection.

### 4. Validation Checks
```solidity
require(tokenAddress != address(0), "Invalid token address");
require(contractBalance > 0, "No tokens to recover");
require(token.ownerOf(tokenId) == address(this), "Contract doesn't own");
```
**Benefit:** Prevents errors and provides clear failure messages.

---

## 📊 Monitoring for Unexpected Tokens

### Script to Check for Foreign Tokens

```javascript
// monitor-tokens.js
async function checkForUnexpectedTokens() {
  const contract = await ethers.getContractAt("SuperFantastic", CONTRACT_ADDRESS);
  
  // 1. Check native token balance
  const nativeBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  console.log(`Native token: ${ethers.formatEther(nativeBalance)} MATIC`);
  
  // 2. Check common ERC20s on Polygon
  const commonTokens = [
    { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", name: "USDC", decimals: 6 },
    { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", name: "USDT", decimals: 6 },
    { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", name: "DAI", decimals: 18 },
    { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", name: "WETH", decimals: 18 },
    { address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", name: "WMATIC", decimals: 18 }
  ];
  
  console.log("\nChecking ERC20 tokens:");
  for (const token of commonTokens) {
    const tokenContract = await ethers.getContractAt("IERC20", token.address);
    const balance = await tokenContract.balanceOf(CONTRACT_ADDRESS);
    
    if (balance > 0) {
      const formatted = balance / (10 ** token.decimals);
      console.log(`⚠️  ${token.name}: ${formatted}`);
    }
  }
  
  // 3. Listen for incoming transfers
  const usdcContract = await ethers.getContractAt("IERC20", commonTokens[0].address);
  
  usdcContract.on("Transfer", (from, to, amount) => {
    if (to === CONTRACT_ADDRESS) {
      console.log(`\n🚨 ALERT: Received ${amount / 1e6} USDC from ${from}`);
    }
  });
}

// Run every hour
setInterval(checkForUnexpectedTokens, 3600000);
```

---

## 📋 Recovery Checklist

### Before Recovery:
- [ ] Identify what token was sent (address, amount/tokenId)
- [ ] Verify contract actually owns the tokens
- [ ] Check token value (important for NFTs)
- [ ] Determine if it was accidental or intentional
- [ ] Contact sender if high value

### During Recovery:
- [ ] Use correct function (recoverERC20 vs recoverERC721)
- [ ] Provide correct token address
- [ ] Specify amount (ERC20) or tokenId (ERC721)
- [ ] Execute transaction from owner wallet
- [ ] Wait for confirmation

### After Recovery:
- [ ] Verify tokens arrived in owner wallet
- [ ] Document the recovery (what, when, why)
- [ ] Return to sender if appropriate
- [ ] Update monitoring to prevent future occurrences

---

## 🔄 Automated Recovery Script

```javascript
// auto-recover.js
const AUTO_RECOVER_THRESHOLD = {
  USDC: 10 * 1e6,      // Auto-recover if > $10 USDC
  DAI: ethers.parseEther("10"),  // Auto-recover if > 10 DAI
  MATIC: ethers.parseEther("100") // Auto-recover if > 100 MATIC
};

async function autoRecover() {
  const contract = await ethers.getContractAt("SuperFantastic", CONTRACT_ADDRESS);
  
  // Check USDC
  const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  const usdcContract = await ethers.getContractAt("IERC20", USDC);
  const usdcBalance = await usdcContract.balanceOf(CONTRACT_ADDRESS);
  
  if (usdcBalance > AUTO_RECOVER_THRESHOLD.USDC) {
    console.log(`Auto-recovering ${usdcBalance / 1e6} USDC`);
    await contract.recoverERC20(USDC, 0);
  }
  
  // Check native MATIC
  const maticBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  const expectedBalance = await estimateExpectedBalance(); // Based on recent mints
  
  if (maticBalance > expectedBalance + AUTO_RECOVER_THRESHOLD.MATIC) {
    console.log(`Auto-recovering ${ethers.formatEther(maticBalance - expectedBalance)} MATIC`);
    await contract.withdraw();
  }
}

// Run daily
setInterval(autoRecover, 86400000);
```

---

## ⚠️ Important Warnings

### 1. Cannot Recover Collection's Own NFTs
```javascript
// ❌ This will FAIL
await contract.recoverERC721(
  contractAddress,  // Contract's own address
  tokenId           // One of your SuperFantastic NFTs
);
// Error: "Cannot recover own tokens"
```

**Why:** Prevents owner from stealing user NFTs.

### 2. Gas Costs for Recovery
Recovery functions cost gas. Budget accordingly:
- `withdraw()`: ~40,000 gas (~$0.002 on Polygon)
- `recoverERC20()`: ~60,000 gas (~$0.003 on Polygon)
- `recoverERC721()`: ~80,000 gas (~$0.004 on Polygon)

### 3. NFT Spam
Many contracts send spam NFTs to popular addresses. Not all are worth recovering:
```javascript
// Check value before bothering to recover
const floorPrice = await getFloorPrice(nftAddress);
if (floorPrice < ethers.parseEther("0.01")) {
  console.log("Spam NFT, ignoring");
  return;
}
```

---

## 📞 User Support: "I sent the wrong token!"

### Template Response:
```
Hi [User],

Thank you for reaching out. We see that you accidentally sent [X amount] of [Token] to the contract address.

Good news: Our contract has recovery functions and we can retrieve your tokens!

Steps we'll take:
1. Verify the transaction on PolygonScan
2. Recover the tokens using our recoverERC20() function
3. Return them to your wallet: [address]

Timeline: 24-48 hours

Transaction for your records: [tx hash]

Best,
SuperFantastic Team
```

---

## 🎯 Best Practices

### 1. Regular Monitoring
- Check for unexpected tokens weekly
- Set up alerts for incoming ERC20 transfers
- Monitor contract balance vs expected balance

### 2. Quick Response
- Recover valuable tokens within 24 hours
- Contact senders for high-value accidents
- Document all recoveries

### 3. Clear Communication
- Update FAQ about what happens if wrong token sent
- Provide recovery timeline estimates
- Be transparent about the process

### 4. Prevention
- Clear UI showing which token to use
- Wallet warnings when sending to contract
- Educational content for users

---

## ✅ Summary

**What Can Go Into Contract:**
- ✅ Native tokens (MATIC/ETH/etc) - FROM MINT FEES
- ✅ Native tokens (accidental sends)
- ✅ ERC20 tokens (accidental sends)
- ✅ ERC721 NFTs (accidental sends)

**How to Get Them Out:**
- ✅ `withdraw()` - Native tokens
- ✅ `recoverERC20(address, amount)` - ERC20 tokens
- ✅ `recoverERC721(address, tokenId)` - NFTs
- ❌ Cannot recover your own SuperFantastic NFTs (security feature)

**Security:**
- ✅ Only owner can recover
- ✅ Reentrancy protected
- ✅ Event emissions for transparency
- ✅ Input validation on all functions

Your contract is now **fully equipped** to handle any token that might accidentally (or intentionally) end up in it! 🎉