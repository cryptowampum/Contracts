# 🦄 SUPERFANTASTIC - DEVELOPMENT CONTINUATION PROMPT

> **Use this prompt to continue development with full context**

---

## 📋 PROJECT OVERVIEW

I'm working on **SuperFantastic**, a secure soulbound NFT smart contract for peer-to-peer, in-real-life NFT issuance. This contract allows event teams to mint custom NFTs with photos and personalized messages for attendees.

### Current Status
✅ **Production Ready** - Security Score: A (94/100)  
✅ **Fully Audited** - Two comprehensive security audits completed  
✅ **Deployed** - Polygon mainnet and Amoy testnet  
✅ **Documented** - 15+ comprehensive guides  

---

## 🎯 KEY SPECIFICATIONS

### Contract Type
- **Standard:** ERC721 (Soulbound - transfers disabled)
- **Purpose:** Capture IRL moments with custom photos and messages
- **Platform:** ThirdWeb deployment, compatible with ThirdWeb React SDK
- **Chain:** Polygon (primary), multi-chain ready

### Core Features
- ✅ **Soulbound** - Cannot transfer (burns to address(0) allowed)
- ✅ **Custom Photos** - Unique IPFS image per token
- ✅ **Personalized Messages** - Individual text for each recipient
- ✅ **Team Minting** - Authorized staff create NFTs for others
- ✅ **Batch Operations** - Efficient group photo minting
- ✅ **Content Moderation** - NSFW flagging system
- ✅ **Token Recovery** - Rescue accidentally sent tokens
- ✅ **On-Chain Metadata** - Fully decentralized JSON

### Supply & Limits
- **Max Supply:** 10,000 tokens
- **Max Batch Mint:** 100 tokens per transaction
- **Max Batch Flag:** 50 tokens per moderation action
- **Event Date Range:** 1 year future, 5 years past

---

## 🔧 TECHNICAL ARCHITECTURE

### Dependencies
```solidity
OpenZeppelin v5.4.0:
- ERC721.sol
- ERC721Enumerable.sol
- IERC20.sol
- SafeERC20.sol (for token recovery)
- Ownable.sol
- Strings.sol
- ReentrancyGuard.sol
```

### Contract Structure
```solidity
contract SuperFantastic is 
    ERC721, 
    ERC721Enumerable, 
    Ownable, 
    ReentrancyGuard 
{
    using Strings for uint256;
    using SafeERC20 for IERC20;
    
    // Constants
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant MAX_BATCH_FLAG = 50;
    
    // State Variables
    uint256 private _nextTokenId = 1;
    uint256 public mintPrice = 0;
    string private baseImageURI;
    string private baseAnimationURI;
    string private nsfwReplacementImage;
    
    // Mappings
    mapping(uint256 => TokenMetadata) public tokenMetadata;
    mapping(uint256 => bool) public isFlagged;
    mapping(address => bool) public teamMinters;
    mapping(address => bool) public moderators;
    
    // Structs
    struct TokenMetadata {
        string customImage;
        string customText;
        string eventName;
        uint256 eventDate;
        address minter;
    }
}
```

---

## 🛡️ SECURITY FEATURES (CRITICAL!)

### 1. Reentrancy Protection
```solidity
// ALL mint and withdrawal functions use nonReentrant
function mint(...) external payable nonReentrant { }
function teamMint(...) external nonReentrant { }
function withdraw() external onlyOwner nonReentrant { }
function recoverERC20(...) external onlyOwner nonReentrant { }
```

### 2. CEI Pattern (Checks-Effects-Interactions)
```solidity
// ALWAYS follow this order:
// 1. CHECKS (require statements)
require(msg.value >= mintPrice, "Insufficient payment");

// 2. EFFECTS (state changes)
uint256 tokenId = _nextTokenId++;
tokenMetadata[tokenId] = TokenMetadata({...});

// 3. INTERACTIONS (external calls)
_safeMint(msg.sender, tokenId);
```

### 3. Soulbound Enforcement
```solidity
// Block ALL transfers except mints and burns
function _update(address to, uint256 tokenId, address auth) internal override {
    address from = _ownerOf(tokenId);
    if (from != address(0) && to != address(0)) {
        revert("Soulbound: transfers disabled");
    }
    return super._update(to, tokenId, auth);
}

// Disable ALL approvals
function approve(address, uint256) public pure override {
    revert("Soulbound: approvals disabled");
}
```

### 4. Theft Prevention
```solidity
// CRITICAL: Owner cannot steal user NFTs
function recoverERC721(address tokenAddress, uint256 tokenId) external {
    require(tokenAddress != address(this), "Cannot recover own tokens");
    // ...
}
```

### 5. SafeERC20 for Token Recovery
```solidity
// Use SafeERC20 for non-standard token compatibility
using SafeERC20 for IERC20;

function recoverERC20(address tokenAddress, uint256 amount) external {
    IERC20 token = IERC20(tokenAddress);
    token.safeTransfer(owner(), amountToRecover); // SafeERC20 handles edge cases
}
```

---

## 📊 CONTRACT FUNCTIONS

### Minting Functions
```javascript
// Public mint (user mints for themselves)
mint(customImage, customText, eventName, eventDate) payable

// Team mint (authorized staff creates NFT for recipient)
teamMint(recipient, customImage, customText, eventName, eventDate)

// Batch mint (group photos)
batchTeamMint(recipients[], customImages[], customTexts[], eventName, eventDate)
```

### Admin Functions
```javascript
// Access control
setTeamMinter(address, bool)
setModerator(address, bool)

// Configuration
setMintPrice(uint256)
updateBaseImageURI(string)
updateBaseAnimationURI(string)

// Emergency
pause()
unpause()
```

### Moderation Functions
```javascript
// Flag content
flagToken(tokenId, reason)
batchFlagTokens(tokenIds[], reason)
unflagToken(tokenId) // owner only

// Configure
setNSFWReplacementImage(string)
```

### Token Recovery Functions
```javascript
// Withdraw native tokens (MATIC/ETH/etc)
withdraw()
withdrawETH() // legacy alias

// Recover ERC20 tokens
recoverERC20(tokenAddress, amount) // amount=0 recovers all

// Recover ERC721 NFTs
recoverERC721(tokenAddress, tokenId)
```

### View Functions
```javascript
// Token info
tokenURI(tokenId) // Returns on-chain JSON
getTokenMetadata(tokenId) // Returns full metadata struct

// Contract state
isMintingActive()
getBaseImageURI()
getBaseAnimationURI()
getNSFWReplacementImage()
```

---

## 🎨 METADATA STRUCTURE

### On-Chain JSON Format
```json
{
  "name": "SuperFantastic #42 - ETH Denver 2025",
  "description": "Great talking about Web3! Let's collaborate 🚀",
  "image": "ipfs://QmCustomPhoto...",
  "animation_url": "ipfs://QmVideo...",
  "attributes": [
    { "trait_type": "Owner", "value": "0xWallet..." },
    { "trait_type": "Created By", "value": "0xTeamMember..." },
    { "trait_type": "Event", "value": "ETH Denver 2025" },
    { "trait_type": "Event Date", "display_type": "date", "value": 1741564800 },
    { "trait_type": "Custom Photo", "value": "true" },
    { "trait_type": "Status", "value": "Flagged" } // if flagged
  ]
}
```

### When Flagged
- Image replaced with `nsfwReplacementImage`
- Description appended with "[Content flagged by moderators]"
- "Status": "Flagged" attribute added
- Original data preserved (can be unflagged)

---

## 🚨 CRITICAL SECURITY RULES

### NEVER DO:
❌ Remove `nonReentrant` from any function with external calls  
❌ Change state AFTER external calls (breaks CEI pattern)  
❌ Allow transfers (except mints/burns)  
❌ Use `transfer()` for ERC20 (use `safeTransfer()`)  
❌ Let owner recover own collection's NFTs  
❌ Skip input validation  

### ALWAYS DO:
✅ Use `nonReentrant` on functions with external calls  
✅ Follow CEI pattern (Checks → Effects → Interactions)  
✅ Validate all inputs (addresses, amounts, dates)  
✅ Use SafeERC20 for token transfers  
✅ Emit events for all state changes  
✅ Add comprehensive NatSpec documentation  

---

## 🔄 DEVELOPMENT WORKFLOW

### When Adding New Features

1. **Security First**
   - Will it have external calls? Add `nonReentrant`
   - Does it change state? Follow CEI pattern
   - New inputs? Add validation
   - Affects access? Check role requirements

2. **Test Coverage**
   - Add unit tests for new function
   - Add integration tests for workflows
   - Add security tests for attack vectors
   - Add edge case tests

3. **Documentation**
   - Add NatSpec comments
   - Update README
   - Update relevant guides
   - Document any breaking changes

4. **Review Checklist**
   - [ ] Follows CEI pattern
   - [ ] Has `nonReentrant` if needed
   - [ ] Input validation complete
   - [ ] Events emitted
   - [ ] Tests added
   - [ ] Documentation updated
   - [ ] Gas optimized
   - [ ] Security reviewed

---

## 🧪 TESTING REQUIREMENTS

### Must Test For Every Change
```javascript
✅ Access control (only authorized can call)
✅ Input validation (rejects invalid inputs)
✅ State changes (updates correctly)
✅ Events (emitted with correct parameters)
✅ Reentrancy (attacks prevented)
✅ Edge cases (maximum values, empty strings, etc)
✅ Gas costs (within reasonable limits)
```

### Test Template
```javascript
describe("New Feature", function () {
  it("Should work correctly for authorized user", async () => {
    // Test happy path
  });
  
  it("Should revert for unauthorized user", async () => {
    // Test access control
  });
  
  it("Should validate inputs", async () => {
    // Test input validation
  });
  
  it("Should emit event", async () => {
    // Test event emission
  });
  
  it("Should prevent reentrancy", async () => {
    // Test with malicious contract
  });
});
```

---

## 📦 DEPLOYMENT INFORMATION

### Constructor Parameters
```javascript
constructor(
  string memory _baseImageURI,      // Default/fallback image
  string memory _baseAnimationURI,  // Optional video (or "")
  string memory _nsfwImage          // NSFW warning image
)
```

### Deployed Addresses
- **Polygon Mainnet:** `0x228287e8793D7F1a193C9fbA579D91c7A6159176`
- **Polygon Amoy (Testnet):** `0xabA2D513bDA0Ca8C0a3fbaeB0bA071eda492F1C8`

### Post-Deployment Setup
```javascript
// 1. Add team minters
await contract.setTeamMinter("0xTeamMember1...", true);

// 2. Add moderators
await contract.setModerator("0xModerator1...", true);

// 3. Set mint price (if not free)
await contract.setMintPrice(ethers.parseEther("0.01"));

// 4. Verify setup
console.log("Minting Active:", await contract.isMintingActive());
```

---

## 🌐 MULTI-CHAIN NOTES

### Native Token Handling
The `withdraw()` and `withdrawETH()` functions withdraw **whatever native token** the chain uses:
- Ethereum: ETH
- Polygon: MATIC
- BNB Chain: BNB
- Avalanche: AVAX

The function name is just a convention - it works correctly on all chains.

### Gas Cost Estimates
| Chain | Mint Cost | Recommended Price |
|-------|-----------|-------------------|
| Polygon | ~$0.01 | FREE (gas negligible) |
| Ethereum | ~$10-15 | 0.005 ETH |
| Arbitrum | ~$0.30 | 0.0001 ETH |
| Base | ~$0.15 | 0.0001 ETH |

---

## 📚 AVAILABLE DOCUMENTATION

All documents are in the `docs/` folder:

### Security
- `Security_Audit.md` - Initial comprehensive audit
- `Token_Recovery_Security_Audit.md` - Recovery functions audit
- `Final_Security_Audit_Summary.md` - Complete sign-off

### Deployment
- `Deployment_Checklist.md` - Step-by-step deployment guide
- `Multi-Chain_Deployment_Guide.md` - Cross-chain deployment

### Usage
- `SuperFantastic_IRL_NFT_Guide.md` - User and team documentation
- `Token_Recovery_Guide.md` - How to recover stuck tokens
- `Team_Training.md` - Event staff training
- `Best_Practices.md` - Photo and messaging tips

### Development
- `SuperFantastic_Complete_Summary.md` - Full project overview
- `API.md` - Contract functions reference
- `Integration.md` - ThirdWeb SDK usage

---

## 🎯 COMMON TASKS

### Add New Team Minter
```javascript
await contract.setTeamMinter("0xNewTeamMember...", true);
console.log("Team minter added");
```

### Flag Inappropriate Content
```javascript
await contract.flagToken(tokenId, "NSFW content");
console.log("Token flagged");
```

### Recover Stuck Tokens
```javascript
// Recover USDC
const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
await contract.recoverERC20(USDC, 0); // 0 = recover all

// Recover NFT
await contract.recoverERC721("0xNFT_ADDRESS", tokenId);

// Withdraw native tokens
await contract.withdraw();
```

### Update Metadata URIs
```javascript
await contract.updateBaseImageURI("ipfs://QmNewImage...");
await contract.updateBaseAnimationURI("ipfs://QmNewVideo...");
await contract.setNSFWReplacementImage("ipfs://QmNewNSFW...");
```

---

## 🚨 EMERGENCY PROCEDURES

### If Security Issue Found
```javascript
// 1. PAUSE IMMEDIATELY
await contract.pause();

// 2. Assess the situation
// - Check recent transactions
// - Review flagged content
// - Identify any exploits
// - Determine scope of impact

// 3. Take corrective action
// - Flag inappropriate tokens
// - Update URIs if needed
// - Communicate with community
// - Document the incident

// 4. Unpause when safe
await contract.unpause();
```

### If Wrong Token Sent to Contract
```javascript
// Check what was sent
const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const usdcContract = await ethers.getContractAt("IERC20", USDC);
const balance = await usdcContract.balanceOf(contractAddress);

// Recover it
await contract.recoverERC20(USDC, 0);

// Return to sender if appropriate
await usdcContract.transfer(senderAddress, balance);
```

---

## 💡 FEATURE IDEAS (Future Development)

### Phase 2 - Enhancement Ideas
- [ ] Multiple photos per token (gallery)
- [ ] GPS coordinates of minting location
- [ ] Video support (beyond animation_url)
- [ ] Audio messages
- [ ] Multi-sig minting (both parties sign)
- [ ] QR code generation for easy sharing

### Phase 3 - Advanced Features
- [ ] Achievement badges for milestones
- [ ] Connection graph visualization
- [ ] Event series tracking
- [ ] Rarity system based on event type
- [ ] Integration with calendar apps
- [ ] Automatic IPFS upload from mobile

### Phase 4 - Ecosystem
- [ ] Frontend web application
- [ ] Mobile app for teams
- [ ] Analytics dashboard
- [ ] API for third-party integrations
- [ ] White-label platform
- [ ] Cross-chain bridge for viewing

---

## 🔍 DEBUGGING TIPS

### Common Issues & Solutions

**Issue: Mint fails with "Insufficient payment"**
```javascript
// Check mint price
const price = await contract.mintPrice();
console.log("Required:", ethers.formatEther(price));

// Send correct amount
await contract.mint(..., { value: price });
```

**Issue: teamMint fails with "Not authorized"**
```javascript
// Check if address is team minter
const isAuthorized = await contract.teamMinters(address);
console.log("Is team minter:", isAuthorized);

// Add as team minter
await contract.setTeamMinter(address, true);
```

**Issue: Token metadata not showing**
```javascript
// Check if token exists
const exists = await contract._tokenExists(tokenId);

// Get metadata
const metadata = await contract.getTokenMetadata(tokenId);
console.log(metadata);

// Get full URI
const uri = await contract.tokenURI(tokenId);
console.log(uri);
```

**Issue: Withdrawal fails**
```javascript
// Check balance
const balance = await ethers.provider.getBalance(contractAddress);
console.log("Contract balance:", ethers.formatEther(balance));

// Ensure owner wallet can receive
// (owner must be EOA or contract with payable receive/fallback)
```

---

## 📝 CODE STYLE GUIDE

### Naming Conventions
```solidity
// Constants: UPPER_SNAKE_CASE
uint256 public constant MAX_SUPPLY = 10000;

// State variables: camelCase
uint256 private _nextTokenId;
string private baseImageURI;

// Functions: camelCase
function teamMint(...) external { }

// Events: PascalCase
event Minted(address indexed to, uint256 indexed tokenId);

// Modifiers: camelCase
modifier whenNotPaused() { }
```

### Function Order
```solidity
1. Constructor
2. Modifiers
3. External functions
4. Public functions
5. Internal functions
6. Private functions
7. View/Pure functions
```

### Comments
```solidity
/// @notice User-facing description
/// @dev Technical implementation details
/// @param paramName Description of parameter
/// @return Description of return value
function example(uint256 paramName) external returns (uint256) {
    // Implementation comments for complex logic
}
```

---

## 🎓 LEARNING RESOURCES

### Solidity Security
- [ConsenSys Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [SWC Registry](https://swcregistry.io/)
- [Trail of Bits Building Secure Contracts](https://github.com/crytic/building-secure-contracts)

### OpenZeppelin
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
- [OpenZeppelin v5 Migration Guide](https://docs.openzeppelin.com/contracts/5.x/upgradeable)

### ThirdWeb
- [ThirdWeb Portal](https://portal.thirdweb.com/)
- [ThirdWeb Deploy Docs](https://portal.thirdweb.com/deploy)
- [ThirdWeb SDK](https://portal.thirdweb.com/typescript)

### Testing
- [Hardhat Documentation](https://hardhat.org/docs)
- [Chai Matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)
- [Ethers.js](https://docs.ethers.org/)

---

## 🛠️ DEVELOPMENT COMMANDS

### Essential Commands
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run specific test
npx hardhat test --grep "mint"

# Deploy to testnet
npx thirdweb deploy --network amoy -k SECRET_KEY

# Deploy to mainnet
npx thirdweb deploy --network polygon -k SECRET_KEY

# Verify contract
npx hardhat verify --network polygon CONTRACT_ADDRESS "arg1" "arg2" "arg3"

# Run local node
npx hardhat node

# Check contract size
npx hardhat size-contracts

# Gas report
REPORT_GAS=true npx hardhat test

# Coverage
npx hardhat coverage
```

### Useful Scripts
```bash
# Check for security issues
npm run security-check

# Format code
npm run format

# Lint code
npm run lint

# Build documentation
npm run docs
```

---

## 🔗 IMPORTANT LINKS

### Contract Addresses
- **Polygon Mainnet:** https://polygonscan.com/address/0x228287e8793D7F1a193C9fbA579D91c7A6159176
- **Polygon Amoy:** https://amoy.polygonscan.com/address/0xabA2D513bDA0Ca8C0a3fbaeB0bA071eda492F1C8

### Resources
- **GitHub:** https://github.com/yourusername/superfantastic
- **Documentation:** https://docs.superfantastic.io
- **Discord:** https://discord.gg/superfantastic
- **Twitter:** https://twitter.com/SuperFantasticNFT

### Support
- **Technical:** dev@superfantastic.io
- **Security:** security@superfantastic.io
- **General:** support@superfantastic.io

---

## ✅ PRE-DEPLOYMENT CHECKLIST

Before deploying any changes to mainnet:

### Code Review
- [ ] All new code follows CEI pattern
- [ ] `nonReentrant` added where needed
- [ ] Input validation comprehensive
- [ ] Events emitted for state changes
- [ ] NatSpec documentation complete
- [ ] No TODOs or FIXMEs in code

### Testing
- [ ] All tests passing
- [ ] New tests added for new features
- [ ] Security tests updated
- [ ] Gas costs verified
- [ ] Edge cases tested
- [ ] Integration tests passing

### Security
- [ ] Security review completed
- [ ] No critical/high issues
- [ ] Medium issues addressed or documented
- [ ] Reentrancy protection verified
- [ ] Access control verified

### Documentation
- [ ] README updated
- [ ] PROMPT.md updated
- [ ] API docs updated
- [ ] Deployment guide updated
- [ ] Changelog updated

### Deployment
- [ ] Testnet deployment successful
- [ ] Testnet testing complete
- [ ] Constructor parameters verified
- [ ] Team trained on new features
- [ ] Monitoring setup ready

---

## 🎯 QUICK REFERENCE

### Key Security Principles
1. **CEI Pattern** - Always Checks → Effects → Interactions
2. **Reentrancy Guard** - Use on all functions with external calls
3. **Input Validation** - Validate everything from users
4. **SafeERC20** - Use for all ERC20 transfers
5. **Access Control** - Verify permissions on sensitive functions

### Key Contract Constants
```solidity
MAX_SUPPLY = 10,000
MAX_BATCH_SIZE = 100
MAX_BATCH_FLAG = 50
MAX_FUTURE_EVENT_DATE = 365 days
MAX_PAST_EVENT_DATE = 1825 days
```

### Key Roles
- **Owner** - Full control, can pause, update URIs, manage roles
- **Team Minters** - Can create NFTs for others
- **Moderators** - Can flag inappropriate content
- **Users** - Can mint for themselves (if price paid)

### Key Events
- `Minted` - When NFT created
- `TokenFlagged` / `TokenUnflagged` - Moderation actions
- `NativeTokenWithdrawn` - Native token recovery
- `ERC20Recovered` / `ERC721Recovered` - Token recovery

---

## 💬 WHEN TO ASK FOR HELP

### Ask Claude (or team) when:
- ❓ Adding new features that involve external calls
- ❓ Modifying existing security-critical functions
- ❓ Unsure about reentrancy implications
- ❓ Need help with CEI pattern implementation
- ❓ Gas optimization questions
- ❓ Multi-chain compatibility concerns
- ❓ Token recovery edge cases
- ❓ Complex test scenarios

### Include in your question:
1. What you're trying to achieve
2. What you've tried already
3. Relevant code snippets
4. Any error messages
5. Security concerns you have

---

## 🎉 SUCCESS CRITERIA

### For New Features
✅ Security review passed  
✅ All tests passing  
✅ Gas costs reasonable  
✅ Documentation complete  
✅ Team trained  
✅ Testnet verified  

### For Deployments
✅ Testnet testing successful  
✅ Security audit (if major changes)  
✅ Team ready  
✅ Monitoring setup  
✅ Emergency procedures documented  
✅ Community informed  

---

## 📞 CONTACT & SUPPORT

### For Development Questions
- **Developer Discord:** #dev-support channel
- **Email:** dev@superfantastic.io
- **GitHub Issues:** For bugs and feature requests

### For Security Issues
- **Email:** security@superfantastic.io
- **Response Time:** <24 hours
- **Critical Issues:** Pause contract immediately

### For General Support
- **Documentation:** https://docs.superfantastic.io
- **FAQ:** https://superfantastic.io/faq
- **Community:** https://discord.gg/superfantastic

---

## 🚀 READY TO CONTINUE DEVELOPMENT!

You now have all the context needed to:
- ✅ Add new features securely
- ✅ Fix bugs with confidence
- ✅ Deploy to new chains
- ✅ Help users with issues
- ✅ Maintain code quality

### Next Steps Recommendations:
1. Review this entire prompt
2. Check the latest deployed contract
3. Run the test suite locally
4. Review recent GitHub issues/PRs
5. Start coding with security in mind!

---

**Remember:** Security first, always follow CEI pattern, use `nonReentrant`, validate inputs, and test thoroughly!

**Made with ❤️ by the SuperFantastic team**

*Let's build amazing IRL NFT experiences together!* 🦄✨

---

**Last Updated:** October 12, 2025  
**Contract Version:** 2.0 (with Token Recovery)  
**Security Score:** A (94/100)  
**Status:** Production Ready ✅