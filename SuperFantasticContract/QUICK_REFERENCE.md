# 🦄 SuperFantastic - Quick Reference Card

> **Print this and keep it handy!**

---

## 🎯 Contract Info

**Name:** SuperFantastic Event Collection  
**Symbol:** SFEC  
**Network:** Polygon (primary)  
**Security:** A (94/100) ✅ Production Ready  

**Polygon Mainnet:** `0x228287e8793D7F1a193C9fbA579D91c7A6159176`  
**Polygon Amoy:** `0xabA2D513bDA0Ca8C0a3fbaeB0bA071eda492F1C8`

---

## 🚀 Common Commands

### Mint IRL NFT
```javascript
await contract.teamMint(
  "0xRecipient...",
  "ipfs://QmPhoto...",
  "Great meeting you!",
  "ETH Denver 2025",
  1741564800
);
```

### Batch Mint (Group Photo)
```javascript
await contract.batchTeamMint(
  ["0xAddr1...", "0xAddr2..."],
  ["ipfs://img1", "ipfs://img2"],
  ["Message 1", "Message 2"],
  "Event Name",
  timestamp
);
```

### Flag Content
```javascript
await contract.flagToken(42, "NSFW content");
```

### Recover Tokens
```javascript
// Native tokens
await contract.withdraw();

// ERC20
await contract.recoverERC20("0xUSDC...", 0);

// NFTs
await contract.recoverERC721("0xNFT...", tokenId);
```

---

## 🔐 Security Checklist

Before ANY code change:
- [ ] Uses `nonReentrant` if external calls?
- [ ] Follows CEI pattern?
- [ ] Validates all inputs?
- [ ] Emits events?
- [ ] Has tests?
- [ ] Security reviewed?

---

## ⚠️ NEVER DO

❌ Remove `nonReentrant`  
❌ Change state after external calls  
❌ Skip input validation  
❌ Use `transfer()` for ERC20  
❌ Allow transfers (except burns)  
❌ Let owner steal user NFTs  

---

## ✅ ALWAYS DO

✅ Use `nonReentrant` with external calls  
✅ Follow CEI pattern  
✅ Validate inputs  
✅ Use `SafeERC20`  
✅ Emit events  
✅ Write tests  

---

## 🔢 Key Constants

```solidity
MAX_SUPPLY = 10,000
MAX_BATCH_SIZE = 100
MAX_BATCH_FLAG = 50
MAX_FUTURE_EVENT_DATE = 365 days
MAX_PAST_EVENT_DATE = 1825 days
```

---

## 👥 Roles

**Owner** - Everything  
**Team Minters** - Create NFTs  
**Moderators** - Flag content  
**Users** - Self-mint (if paid)  

---

## 🚨 Emergency

```javascript
// PAUSE IMMEDIATELY
await contract.pause();

// Fix issue...

// Unpause when safe
await contract.unpause();
```

---

## 📞 Contacts

**Security:** security@superfantastic.io  
**Support:** support@superfantastic.io  
**Docs:** https://docs.superfantastic.io  

---

## 🧪 Test Before Deploy

```bash
npx hardhat test
npx thirdweb deploy --network amoy
# Test on testnet
npx thirdweb deploy --network polygon
```

---

**v2.0 | Security: A (94/100) | Status: Production Ready ✅**