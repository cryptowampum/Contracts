# 🦄 SuperFantastic - P2P IRL NFT System

![Security Score](https://img.shields.io/badge/Security-A%20(94%2F100)-brightgreen)
![Solidity](https://img.shields.io/badge/Solidity-0.8.17-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

> A secure, soulbound NFT contract for creating personalized, peer-to-peer NFTs during in-real-life interactions. Capture authentic moments with custom photos and messages.

---

## 🎯 Overview

**SuperFantastic** transforms IRL interactions into permanent on-chain memories. Each NFT features:
- 📸 **Custom Photo** - Unique image from actual encounter
- 💬 **Personalized Message** - Individual text for each recipient
- 🔒 **Soulbound** - Cannot be transferred (permanent memory)
- 🎨 **On-Chain Metadata** - Fully decentralized
- 🛡️ **Security Hardened** - Comprehensive audit passed

### Key Features
✅ Team minting system for event staff  
✅ Batch operations for group photos  
✅ Content moderation with NSFW flagging  
✅ Multi-chain compatible (Polygon, Ethereum, etc)  
✅ Token recovery (rescue accidentally sent tokens)  
✅ Pausable for emergency situations  

---

## 🚀 Quick Start

### Prerequisites
```bash
node >= 16.0.0
npm >= 8.0.0
```

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/superfantastic.git
cd superfantastic

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY
```

### Deploy to Testnet
```bash
# Deploy to Polygon Amoy (testnet)
npx thirdweb deploy --network amoy -k YOUR_SECRET_KEY

# Constructor parameters:
# - baseImageURI: "ipfs://QmYourDefaultImage..."
# - baseAnimationURI: "ipfs://QmYourVideo..." (or "")
# - nsfwImage: "ipfs://QmYourNSFWWarning..."
```

### Deploy to Mainnet
```bash
# Deploy to Polygon mainnet
npx thirdweb deploy --network polygon -k YOUR_SECRET_KEY
```

---

## 📋 Contract Details

### Deployed Contracts

| Network | Address | Explorer |
|---------|---------|----------|
| Polygon Mainnet | `0x228287e8793D7F1a193C9fbA579D91c7A6159176` | [PolygonScan](https://polygonscan.com/address/0x228287e8793D7F1a193C9fbA579D91c7A6159176) |
| Polygon Amoy (Testnet) | `0xabA2D513bDA0Ca8C0a3fbaeB0bA071eda492F1C8` | [Amoy Scan](https://amoy.polygonscan.com/address/0xabA2D513bDA0Ca8C0a3fbaeB0bA071eda492F1C8) |

### Contract Specifications
```solidity
Name: SuperFantastic Event Collection
Symbol: SFEC
Standard: ERC721 (Soulbound)
Max Supply: 10,000
Chain: Polygon (primary), Multi-chain ready
```

---

## 💡 Usage Examples

### For Event Teams (Minting IRL NFTs)

```javascript
// Single mint with custom photo
await contract.teamMint(
  "0xAttendeeWallet...",                    // Recipient
  "ipfs://QmPhotoTogether...",              // Custom photo
  "Great talking about Web3! Let's collaborate 🚀",
  "ETH Denver 2025",                        // Event name
  1741564800                                // Event timestamp
);

// Batch mint for group photo
const recipients = ["0xAddr1...", "0xAddr2...", "0xAddr3..."];
const photos = ["ipfs://QmGroup...", "ipfs://QmGroup...", "ipfs://QmGroup..."];
const messages = [
  "Thanks for the awesome workshop!",
  "Great questions today!",
  "See you at the next event!"
];

await contract.batchTeamMint(
  recipients,
  photos,
  messages,
  "Smart Contract Workshop - NYC",
  1741564800
);
```

### For Contract Admins

```javascript
// Add team minter
await contract.setTeamMinter("0xTeamMember...", true);

// Add moderator
await contract.setModerator("0xModerator...", true);

// Set mint price (default: free)
await contract.setMintPrice(ethers.parseEther("0.01"));

// Pause/unpause minting
await contract.pause();
await contract.unpause();
```

### Token Recovery

```javascript
// Withdraw native tokens (MATIC/ETH)
await contract.withdraw();

// Recover ERC20 tokens (USDC, etc)
await contract.recoverERC20("0xUSDC_ADDRESS", 0); // 0 = recover all

// Recover NFTs from other collections
await contract.recoverERC721("0xNFT_ADDRESS", tokenId);
```

---

## 🔐 Security

### Audit Status
✅ **Security Score: A (94/100)**  
✅ **All Critical Issues: RESOLVED**  
✅ **Production Ready: YES**

### Security Features
- **Reentrancy Protection** - ReentrancyGuard on all critical functions
- **Access Control** - Owner/Team/Moderator role separation
- **Soulbound Enforcement** - Transfers blocked, approvals disabled
- **SafeERC20** - Handles non-standard tokens properly
- **Theft Prevention** - Owner cannot steal user NFTs
- **CEI Pattern** - Checks-Effects-Interactions throughout
- **Input Validation** - Comprehensive parameter checking

### Audit Reports
- [Initial Security Audit](docs/Security_Audit.md)
- [Token Recovery Audit](docs/Token_Recovery_Security_Audit.md)
- [Final Audit Summary](docs/Final_Security_Audit_Summary.md)

---

## 📚 Documentation

### For Users
- [IRL NFT Guide](docs/SuperFantastic_IRL_NFT_Guide.md) - How to receive and view NFTs
- [FAQ](docs/FAQ.md) - Common questions

### For Teams
- [Team Training Guide](docs/Team_Training.md) - How to mint at events
- [Mobile Workflow](docs/Mobile_Workflow.md) - Quick minting process
- [Best Practices](docs/Best_Practices.md) - Photo and messaging tips

### For Developers
- [API Documentation](docs/API.md) - Contract functions reference
- [Integration Guide](docs/Integration.md) - ThirdWeb SDK usage
- [Multi-Chain Deployment](docs/Multi-Chain_Deployment_Guide.md) - Cross-chain guide
- [Token Recovery Guide](docs/Token_Recovery_Guide.md) - Recovery procedures

### For Admins
- [Deployment Checklist](docs/Deployment_Checklist.md) - Step-by-step deployment
- [Configuration Guide](docs/Configuration.md) - Initial setup
- [Monitoring Guide](docs/Monitoring.md) - Analytics and alerts
- [Emergency Procedures](docs/Emergency_Procedures.md) - What to do if issues arise

---

## 🧪 Testing

### Run Tests
```bash
# Install dependencies
npm install

# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/SuperFantastic.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

### Test Coverage
- ✅ 100+ comprehensive test cases
- ✅ Unit tests for all functions
- ✅ Integration tests for workflows
- ✅ Security tests for attack vectors
- ✅ Edge case tests
- ✅ Gas optimization tests

---

## 🛠️ Development

### Project Structure
```
superfantastic/
├── contracts/
│   ├── SuperFantastic.sol          # Main contract
│   └── mocks/
│       └── MockContracts.sol       # Testing utilities
├── scripts/
│   ├── deploy.js                   # Deployment script
│   └── configure.js                # Post-deployment setup
├── test/
│   └── SuperFantastic.test.js      # Test suite
├── docs/
│   ├── Security_Audit.md
│   ├── Token_Recovery_Guide.md
│   └── ...
├── hardhat.config.js               # Hardhat configuration
├── package.json
├── README.md                        # This file
└── PROMPT.md                        # Continuation prompt
```

### Build
```bash
npm run build
# or
npx thirdweb detect
```

### Deploy
```bash
npm run deploy
# or
npx thirdweb deploy
```

---

## 🌐 Multi-Chain Support

### Supported Networks
- ✅ **Polygon** (Primary - recommended)
- ✅ Ethereum Mainnet
- ✅ Arbitrum
- ✅ Optimism
- ✅ Base
- ✅ BNB Chain
- ✅ Avalanche

### Gas Costs (Approximate)

| Chain | Mint Cost | Notes |
|-------|-----------|-------|
| Polygon | ~$0.01 | ✅ Recommended for free minting |
| Ethereum | ~$10-15 | Expensive, consider L2s |
| Arbitrum | ~$0.30 | Good L2 option |
| Base | ~$0.15 | Growing ecosystem |
| BNB Chain | ~$0.20 | Popular in Asia |

---

## 🎨 Use Cases

### 1. Conference Networking
Take photo with attendee → Mint NFT → Permanent connection documented

### 2. Workshop Completion
Group photo after session → Batch mint → Proof of participation

### 3. VIP Events
Exclusive dinner photo → Premium NFT → High-value relationship record

### 4. Community Meetups
Regular meetup photos → Build collection → Track community growth

### 5. Speaker Sessions
Photo with speaker → Collectible series → Event memories

---

## 📊 Features Comparison

| Feature | SuperFantastic | Traditional POAP | Social Media Post |
|---------|---------------|------------------|-------------------|
| Custom Photos | ✅ Unique per NFT | ❌ Generic badge | ✅ Yes |
| Personalized Text | ✅ Individual | ❌ Generic | ✅ Yes |
| Soulbound | ✅ Permanent | ✅ Yes | ❌ No |
| On-Chain | ✅ Fully | ✅ Yes | ❌ Platform-owned |
| Verifiable | ✅ Blockchain | ✅ Blockchain | ❌ Centralized |
| Transferable | ❌ Soulbound | Varies | ❌ No |
| Private | ✅ Recipient only | ✅ Holder | ❌ Public feed |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow Solidity style guide
- Add tests for new features
- Update documentation
- Run security checks
- Follow CEI pattern

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Built With
- [OpenZeppelin](https://openzeppelin.com/) - Secure smart contract libraries
- [ThirdWeb](https://thirdweb.com/) - Deployment and SDK infrastructure
- [Hardhat](https://hardhat.org/) - Development environment
- [Polygon](https://polygon.technology/) - Scalable blockchain

### Inspired By
- POAP - Pioneering event NFTs
- Lens Protocol - Soulbound social identity
- IRL communities - The power of face-to-face connections

### Special Thanks
- @cryptowampum - Vision and development
- Claude AI - Smart contract development and security
- OpenZeppelin team - Secure contract standards
- ThirdWeb team - Excellent developer tools
- Web3 community - Feedback and support

---

## 📞 Support & Community

### Get Help
- **Documentation:** [docs.superfantastic.io](https://docs.superfantastic.io)
- **Discord:** [Join our server](https://discord.gg/superfantastic)
- **Twitter:** [@SuperFantasticNFT](https://twitter.com/SuperFantasticNFT)
- **Email:** support@superfantastic.io

### Report Issues
- **Security:** security@superfantastic.io (Responsible disclosure)
- **Bugs:** [GitHub Issues](https://github.com/yourusername/superfantastic/issues)
- **Feature Requests:** [GitHub Discussions](https://github.com/yourusername/superfantastic/discussions)

### Stay Updated
- **Blog:** [blog.superfantastic.io](https://blog.superfantastic.io)
- **Newsletter:** [subscribe](https://superfantastic.io/newsletter)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

## 🗺️ Roadmap

### ✅ Phase 1: Core (Complete)
- [x] Soulbound NFT implementation
- [x] Custom photos and messages
- [x] Team minting system
- [x] Content moderation
- [x] Security audit
- [x] Token recovery

### 🚧 Phase 2: Scale (In Progress)
- [ ] Frontend application
- [ ] Mobile app for minting
- [ ] IPFS upload automation
- [ ] Analytics dashboard
- [ ] Multi-chain deployment

### 🔮 Phase 3: Enhance (Planned)
- [ ] GPS coordinates
- [ ] Multiple photos per token
- [ ] Video support
- [ ] Achievement badges
- [ ] API for integrations

### 🌟 Phase 4: Ecosystem (Future)
- [ ] White-label platform
- [ ] Event discovery
- [ ] Public galleries
- [ ] Cross-chain bridge
- [ ] Mobile SDK

---

## 📈 Stats

### Current Metrics
- **Security Score:** A (94/100)
- **Test Coverage:** 100+ tests
- **Gas Optimized:** ~250k gas per mint
- **Multi-Chain:** 7+ networks supported
- **Documentation:** 15+ comprehensive guides

### Deployment Stats
- **Testnet Deploys:** 3
- **Mainnet Deploys:** 1
- **Total NFTs Minted:** TBD
- **Events Covered:** TBD
- **Active Team Minters:** TBD

---

## 🎉 Getting Started

Ready to create your first IRL NFT? Here's the quickest path:

1. **Deploy Contract** (5 minutes)
   ```bash
   npx thirdweb deploy --network polygon -k YOUR_KEY
   ```

2. **Configure** (5 minutes)
   ```javascript
   await contract.setTeamMinter("0xYourWallet...", true);
   ```

3. **Mint First NFT** (2 minutes)
   ```javascript
   await contract.teamMint(recipient, photo, message, event, date);
   ```

4. **Start Creating Memories!** 🎊

---

**Made with ❤️ by the SuperFantastic team**

*Transforming IRL interactions into permanent on-chain memories* 🦄✨

##Contract: 0xF993f484225900D2Be4F7253Cfd4Ab14fC9f4621 on Polygon



https://ipfs.io/ipfs/bafkreiaklsgqpu3j2cgyd4ykzvpod42qfs7nycfuvhqudmwxsmsgia772q - base

ipfs://bafkreiaklsgqpu3j2cgyd4ykzvpod42qfs7nycfuvhqudmwxsmsgia772q

https://ipfs.io/ipfs/bafybeicltuul2wzk6ivhrvull3ptlpcc5rh6tvgkv6lkyuzs5l4olapjde - NSFW

ipfs://bafybeicltuul2wzk6ivhrvull3ptlpcc5rh6tvgkv6lkyuzs5l4olapjde

https://ipfs.io/ipfs/bafybeic4tl2qvg7okc4vbirts4qhjijernl6pemv7rhc6qydtbqkmwxk7y - we're cookin

ipfs://bafybeic4tl2qvg7okc4vbirts4qhjijernl6pemv7rhc6qydtbqkmwxk7y
