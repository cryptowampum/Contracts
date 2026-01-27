# Unicorn Ecosystem

A token ecosystem for claiming Unicorn subdomains, community membership NFTs, and viral game rewards on Base and Arbitrum.

## Overview

The Unicorn Ecosystem consists of three smart contracts:

1. **UnicornCredit (UCRED)** - An ERC20 utility token used to claim subdomains
2. **UnicornEcosystemV2** - A UUPS upgradeable ERC721 contract containing soulbound Subdomain NFTs and Community NFTs
3. **DorkToken (DORK)** - A viral ERC20 game reward token for [Unicorn Games](https://games.unicornmini.app)

### How It Works

1. Users receive 1 UCRED token (via airdrop from ThirdWeb server wallet)
2. Users approve the UnicornEcosystem contract to spend their UCRED
3. Users call `claimSubdomain("desiredname")`
4. The contract burns 1 UCRED and mints two soulbound NFTs:
   - **Subdomain NFT** (e.g., "alice.unicorn")
   - **Community NFT** (membership proof)

**OR** (New in V2): Team can directly airdrop NFTs without requiring UCRED:
```javascript
await unicornEcosystem.teamAirdrop(userAddress, "subdomain");
```

---

## Deployed Contracts

### Base Mainnet

| Contract | Address | Type | Verified |
|----------|---------|------|----------|
| **UnicornCredit (UCRED)** | [`0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4`](https://basescan.org/address/0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4#code) | ERC20 | Yes |
| **UnicornEcosystemV2 (Proxy)** | [`0xe83eCe78EB0be0721fF47389Ff674aBaC7E4E58d`](https://basescan.org/address/0xe83eCe78EB0be0721fF47389Ff674aBaC7E4E58d) | UUPS Proxy | Yes |
| **UnicornEcosystemV2 (Impl)** | [`0x8b6A42397291c8D9e832e6EBF50Da86c0f6D3951`](https://basescan.org/address/0x8b6A42397291c8D9e832e6EBF50Da86c0f6D3951#code) | Implementation | Yes |
| **DorkToken (Proxy)** | [`0xBe8Df399a10411B7d212ec6FD9727F4730E3FF48`](https://basescan.org/address/0xBe8Df399a10411B7d212ec6FD9727F4730E3FF48) | UUPS Proxy | Yes |
| **DorkToken (Impl)** | [`0x89d1FeabB50Ed3B99421c61C449a75fe35F31919`](https://basescan.org/address/0x89d1FeabB50Ed3B99421c61C449a75fe35F31919#code) | Implementation | Yes |

### Arbitrum Mainnet

| Contract | Address | Type | Verified |
|----------|---------|------|----------|
| **UnicornCredit (UCRED)** | [`0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6`](https://arbiscan.io/address/0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6#code) | ERC20 | Yes |
| **UnicornEcosystemV2 (Proxy)** | [`0x4927FF835C17495bf209740d1912987445A6dee6`](https://arbiscan.io/address/0x4927FF835C17495bf209740d1912987445A6dee6) | UUPS Proxy | Yes |
| **UnicornEcosystemV2 (Impl)** | [`0xD7D6CF0814eaF9E398Bc3221aED6450C2Ea825CC`](https://arbiscan.io/address/0xD7D6CF0814eaF9E398Bc3221aED6450C2Ea825CC#code) | Implementation | Yes |
| **DorkToken (Proxy)** | [`0x19Ad44859E7cD7EC6cB1e0eE9853C4a78A3F9AEc`](https://arbiscan.io/address/0x19Ad44859E7cD7EC6cB1e0eE9853C4a78A3F9AEc) | UUPS Proxy | Yes |
| **DorkToken (Impl)** | [`0x5B160cd0425b579C7c1046Ea451CA0a993944A59`](https://arbiscan.io/address/0x5B160cd0425b579C7c1046Ea451CA0a993944A59#code) | Implementation | Yes |

### Quick Reference

| Chain | UnicornCredit | UnicornEcosystemV2 (Proxy) | DorkToken (Proxy) |
|-------|---------------|----------------------------|-------------------|
| **Base** | `0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4` | `0xe83eCe78EB0be0721fF47389Ff674aBaC7E4E58d` | `0xBe8Df399a10411B7d212ec6FD9727F4730E3FF48` |
| **Arbitrum** | `0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6` | `0x4927FF835C17495bf209740d1912987445A6dee6` | `0x19Ad44859E7cD7EC6cB1e0eE9853C4a78A3F9AEc` |

---

## V2 New Features

The V2 contract adds several important features:

### Team Airdrop (No UCRED Required)
```javascript
// Single airdrop
await unicornEcosystem.teamAirdrop(userAddress, "subdomain");

// Batch airdrop (up to 50 at once)
await unicornEcosystem.teamAirdropBatch(
  [user1, user2, user3],
  ["name1", "name2", "name3"]
);
```

### Clawback Function
```javascript
// Take back an NFT from any wallet
await unicornEcosystem.clawback(tokenId);

// Batch clawback
await unicornEcosystem.clawbackBatch([tokenId1, tokenId2]);
```

### Upgradeable (UUPS Pattern)
- Contract can be upgraded without losing state
- ~1% gas overhead per transaction
- Only owner can authorize upgrades

---

## Configuration (Both Chains)

### Image URIs

| Setting | Value |
|---------|-------|
| **Subdomain Image URI** | `ipfs://bafkreidtgzztbjue3yamvkd7rdh2hxlsbchd3bclc53s37nvgys2f6s4y4` |
| **Community Image URI** | `ipfs://bafkreid4j2yawdwm4ogi63rbzxjmnh4cdx2ljyhuip36gdgmhhl7cjdxiu` |
| **Domain Suffix** | `.unicorn` |

### Team Minters

These wallets are authorized team minters on **all contracts** on **both chains**:

| Wallet | Address | Role |
|--------|---------|------|
| **ThirdWeb Server** | `0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c` | Server wallet for airdrops |
| **Admin 1** | `0x7049747E615a1C5C22935D5790a664B7E65D9681` | Team minter |
| **Admin 2** | `0x46Ec054Eed3068e908610e1A02D01F5e2a2E3b0b` | Team minter (DorkToken) |

---

## Contract Details

### UnicornCredit (ERC20)

An ERC20 token with the following features:
- **Burnable** - Tokens can be burned (used by UnicornEcosystem for claims)
- **Pausable** - Owner can pause minting
- **Team Minting** - Authorized addresses can mint for free (airdrops)
- **Token Recovery** - Owner can recover accidentally sent tokens

#### Constants
```solidity
INITIAL_MINT_PRICE = 0.01 ether
MAX_BATCH_MINT = 100
```

---

### UnicornEcosystemV2 (ERC721 - Upgradeable)

A UUPS upgradeable NFT contract with two token types:
- **Subdomain NFTs** (Token IDs: 1 to 999,999,999)
- **Community NFTs** (Token IDs: 1,000,000,001+)

Both are **soulbound** (non-transferable).

#### Constants
```solidity
COMMUNITY_TOKEN_OFFSET = 1_000_000_000
MAX_NAME_LENGTH = 128
MIN_NAME_LENGTH = 1
CLAIM_COST = 1e18  // 1 UCRED
MAX_BATCH_SIZE = 50
```

#### Name Validation Rules
- Length: 1-128 characters
- Allowed characters: `a-z`, `0-9`, `-` (hyphen), `.` (dot)
- Hyphens and dots cannot be at start or end
- Names are normalized to lowercase (e.g., "Alice" → "alice")
- Names must be unique (case-insensitive)
- Supports full domain-like names (e.g., "alice.community.unicorn")

#### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `claimSubdomain(string name)` | Public | Burn 1 UCRED, mint both NFTs |
| `teamClaimFor(address, string)` | Team Minter | Claim on behalf of user (requires UCRED) |
| `teamAirdrop(address, string)` | Team Minter | **NEW:** Airdrop NFTs (no UCRED required) |
| `teamAirdropBatch(address[], string[])` | Team Minter | **NEW:** Batch airdrop (up to 50) |
| `clawback(uint256 tokenId)` | Team Minter | **NEW:** Take back NFT from any wallet |
| `clawbackBatch(uint256[])` | Team Minter | **NEW:** Batch clawback |
| `resolveSubdomain(string)` | View | Get owner of subdomain |
| `isNameAvailable(string)` | View | Check if name is available |
| `version()` | View | Returns "2.0.0" |

#### Soulbound Behavior
- Transfers are **blocked** (reverts with "Soulbound: transfers disabled")
- Approvals are **blocked** (reverts with "Soulbound: approvals disabled")
- Only minting (from zero address) and burning (to zero address) are allowed
- Clawback burns the token (allows name to be reclaimed)

---

### DorkToken (ERC20 - Upgradeable)

A viral game reward token for [Unicorn Games](https://games.unicornmini.app). Send DORK to friends and get some back!

#### How It Works

| Action | Result |
|--------|--------|
| **Send DORK to others** | Recipient gets DORK, sender gets bonus from reward pool |
| **Send DORK to yourself** | 90% penalty goes to reward pool, 10% stays with you |
| **Use `transferNoBonus()`** | Direct transfer with no bonus/penalty mechanics |

#### Bonus Formula

```
If sender balance > 100 DORK:
  bonus = min(amountSent, 20 DORK)      // 1x, capped at 20
Else:
  bonus = min(amountSent × 2, 20 DORK)  // 2x, capped at 20

Minimum transfer for bonus: 1 DORK
If reward pool is empty: transfer succeeds, no bonus (graceful failure)
```

#### Constants
```solidity
INITIAL_MINT_PRICE = 0.001 ether
MAX_BATCH_MINT = 1000
MAX_REWARD = 20 * 1e18           // 20 DORK max bonus
REWARD_THRESHOLD = 100 * 1e18    // Balance threshold for 1x vs 2x
MIN_TRANSFER_FOR_BONUS = 1e18    // 1 DORK minimum
SELF_TRANSFER_PENALTY = 90       // 90% penalty
```

#### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `mint(uint256 amount)` | Public | Purchase DORK at mint price |
| `teamMint(address, uint256)` | Team | Mint DORK for free |
| `batchTeamMint(address[], uint256[])` | Team | Batch mint (up to 1000) |
| `mintToRewardPool(uint256)` | Team | Mint directly to reward pool |
| `transfer(address, uint256)` | Public | Transfer with bonus mechanics |
| `transferNoBonus(address, uint256)` | Public | Transfer without bonus/penalty |
| `setMintPrice(uint256)` | Owner | Update mint price |
| `setTokenURI(string)` | Owner | Update token metadata URI |
| `withdrawDorkFromPool(uint256)` | Owner | Emergency pool withdrawal |
| `calculateBonus(address, uint256)` | View | Preview bonus for a transfer |
| `getRewardPoolBalance()` | View | Check reward pool balance |

#### Token Recovery (Owner Only)
```solidity
withdraw()                    // Withdraw ETH
recoverERC20(address, uint)   // Recover any ERC20
recoverERC721(address, uint)  // Recover NFTs
recoverERC1155(address, uint, uint)  // Recover ERC1155
recoverGenericToken(address, bytes)  // Low-level call for ERC-404, etc.
```

#### Token Metadata
```
Token URI: ipfs://bafkreibjew45gzuopqgpcwsstaq4qq2d5x2gsxczenv6c3sdm3vuss6tlm
Image: ipfs://bafkreidtgzztbjue3yamvkd7rdh2hxlsbchd3bclc53s37nvgys2f6s4y4
```

#### Initial Distribution (Per Chain)

| Recipient | Amount |
|-----------|--------|
| Reward Pool (contract) | 1000 DORK |
| Server Wallet (`0x03D2...f8c`) | 100 DORK |
| Team Minter 1 (`0x46Ec...0b`) | 100 DORK |
| Team Minter 2 (`0x7049...81`) | 100 DORK |
| **Total Supply** | **1300 DORK** |

---

## Usage Guide

### For Team: Batch Airdrop Customers

1. Create a CSV file (`airdrop-data.csv`):
   ```csv
   wallet,subdomain
   0x1234...,alice.community.unicorn
   0x5678...,bob.community.unicorn
   ```

2. Run the batch airdrop script:
   ```bash
   AIRDROP_FILE=./airdrop-data.csv npx hardhat run scripts/batchAirdrop.js --network base
   ```

### For Users: Claiming a Subdomain

1. **Receive UCRED** - Get 1 UCRED airdropped to your wallet
2. **Approve spending** - Call `approve()` on UnicornCredit:
   ```javascript
   await unicornCredit.approve(ecosystemAddress, ethers.parseEther("1"));
   ```
3. **Claim subdomain** - Call `claimSubdomain()` on UnicornEcosystem:
   ```javascript
   await unicornEcosystem.claimSubdomain("yourname");
   ```
4. **Done!** - You now own `yourname.unicorn` and a Community NFT

### For ThirdWeb Server: Airdrop Flow

**Option A: Direct Airdrop (Recommended for V2)**
```javascript
// No UCRED required!
await unicornEcosystem.teamAirdrop(userAddress, "subdomain");
```

**Option B: Traditional Flow (requires UCRED)**
```javascript
// 1. Airdrop UCRED
await unicornCredit.teamMint(userAddress, 1);

// 2. User approves (user action required)

// 3. Team claims for user
await unicornEcosystem.teamClaimFor(userAddress, "subdomain");
```

### For Admins: Clawback NFTs

```javascript
// Clawback a single NFT
await unicornEcosystem.clawback(tokenId);

// Clawback multiple NFTs
await unicornEcosystem.clawbackBatch([1, 2, 3]);

// After clawback, the name becomes available again
const isAvailable = await unicornEcosystem.isNameAvailable("clawedbackname");
// true
```

### For Games: Using DorkToken

**Rewarding Players**
```javascript
// Team mint DORK to player
await dorkToken.teamMint(playerAddress, 10); // 10 DORK

// Batch reward multiple players
await dorkToken.batchTeamMint(
  [player1, player2, player3],
  [10, 20, 30]
);
```

**Player Transfers (Viral Mechanic)**
```javascript
// Player sends 5 DORK to friend
// Friend receives 5 DORK
// Player gets up to 10 DORK back (2x bonus if balance ≤100)
await dorkToken.transfer(friendAddress, ethers.parseEther("5"));

// Check potential bonus before sending
const bonus = await dorkToken.calculateBonus(playerAddress, ethers.parseEther("5"));
```

**Refilling the Reward Pool**
```javascript
// Check current pool balance
const poolBalance = await dorkToken.getRewardPoolBalance();

// Mint more DORK to the pool
await dorkToken.mintToRewardPool(1000); // Add 1000 DORK
```

**Transfer Without Bonus (for exchanges/contracts)**
```javascript
// Direct transfer - no bonus, no penalty
await dorkToken.transferNoBonus(recipient, amount);
```

---

## Development

### Prerequisites
```bash
node >= 16.0.0
npm >= 8.0.0
```

### Installation
```bash
cd UnicornEcosystem
npm install
```

### Configuration
Create `.env` file:
```
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_api_key
ARBISCAN_API_KEY=your_api_key
```

### Compile
```bash
npx hardhat compile
```

### Test
```bash
npx hardhat test
```

### Deploy V2 (Upgradeable)
```bash
# Base Mainnet
npx hardhat run scripts/deployV2.js --network base

# Arbitrum Mainnet
npx hardhat run scripts/deployV2.js --network arbitrum
```

### Verify
```bash
# Verify implementation contract
npx hardhat verify --network base <IMPLEMENTATION_ADDRESS>
npx hardhat verify --network arbitrum <IMPLEMENTATION_ADDRESS>
```

---

## File Structure

```
UnicornEcosystem/
├── contracts/
│   ├── UnicornCredit.sol              # ERC20 utility token
│   ├── UnicornEcosystemV1.sol         # Original non-upgradeable (archived)
│   ├── UnicornEcosystemV2.sol         # UUPS upgradeable NFT contract
│   ├── DorkToken.sol                  # UUPS upgradeable viral game token
│   └── interfaces/
│       └── IUnicornCredit.sol         # Interface for cross-contract calls
├── scripts/
│   ├── deploy.js                      # Original deployment script
│   ├── deployV2.js                    # V2 upgradeable deployment
│   ├── deployDork.js                  # DorkToken deployment
│   ├── setupV2.js                     # Setup team minters on V2
│   ├── batchAirdrop.js                # Batch airdrop from CSV/JSON
│   ├── mintTokens.js                  # Mint UCRED tokens
│   └── ...
├── test/
│   ├── UnicornCredit.test.js          # 27 tests
│   ├── UnicornEcosystem.test.js       # 61 tests (including V2 features)
│   └── DorkToken.test.js              # 48 tests
├── metadata/
│   └── dork-token.json                # DorkToken metadata for IPFS
├── hardhat.config.js
├── package.json
└── README.md
```

---

## Security Features

- **UUPS Upgradeable** - Secure upgrade pattern with owner authorization
- **Ownable** - Owner-controlled admin functions
- **ReentrancyGuard** - Protection against reentrancy attacks
- **CEI Pattern** - Checks-Effects-Interactions ordering
- **Custom Pausable** - Emergency pause functionality
- **Token Recovery** - Recover accidentally sent tokens
- **Input Validation** - Comprehensive parameter checking
- **SafeERC20** - Safe token transfers

---

## Events

### UnicornEcosystemV2 Events
```solidity
event SubdomainClaimed(address indexed owner, uint256 indexed subdomainTokenId, uint256 indexed communityTokenId, string name);
event TeamClaimExecuted(address indexed by, address indexed recipient, uint256 subdomainTokenId, string name);
event TeamAirdropExecuted(address indexed by, address indexed recipient, uint256 subdomainTokenId, string name);
event NFTClawedBack(address indexed by, address indexed from, uint256 tokenId);
event UnicornCreditUpdated(address indexed oldAddress, address indexed newAddress);
event BaseSubdomainImageURIUpdated(string oldURI, string newURI);
event BaseCommunityImageURIUpdated(string oldURI, string newURI);
event DomainSuffixUpdated(string oldSuffix, string newSuffix);
event TeamMinterUpdated(address indexed minter, bool authorized);
event Paused(address account);
event Unpaused(address account);
```

### DorkToken Events
```solidity
event Minted(address indexed to, uint256 amount);
event TeamMinted(address indexed by, address indexed to, uint256 amount);
event BatchTeamMinted(address indexed by, address[] recipients, uint256[] amounts);
event TeamMinterUpdated(address indexed minter, bool authorized);
event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
event TransferBonus(address indexed sender, uint256 bonusAmount);
event SelfTransferPenalty(address indexed sender, uint256 penaltyAmount);
event TokenURIUpdated(string oldURI, string newURI);
event NativeTokenWithdrawn(address indexed to, uint256 amount);
event ERC20Recovered(address indexed token, address indexed to, uint256 amount);
event ERC721Recovered(address indexed token, address indexed to, uint256 tokenId);
event ERC1155Recovered(address indexed token, address indexed to, uint256 tokenId, uint256 amount);
event GenericTokenRecovered(address indexed token, bytes data, bool success);
event Paused(address account);
event Unpaused(address account);
```

---

## Gas Estimates

| Operation | Estimated Gas |
|-----------|---------------|
| `UnicornCredit.mint(1)` | ~65,000 |
| `UnicornCredit.teamMint` | ~55,000 |
| `UnicornCredit.approve` | ~45,000 |
| `UnicornEcosystem.claimSubdomain` | ~280,000 |
| `UnicornEcosystem.teamAirdrop` | ~250,000 |
| `UnicornEcosystem.clawback` | ~80,000 |
| `DorkToken.mint(1)` | ~70,000 |
| `DorkToken.transfer` (with bonus) | ~85,000 |
| `DorkToken.transferNoBonus` | ~55,000 |
| `DorkToken.teamMint` | ~60,000 |

---

## Version History

### DorkToken V1.0.0 (Current)
- UUPS upgradeable proxy pattern
- Viral transfer mechanics (2x/1x bonus up to 20 DORK)
- Self-transfer penalty (90% to reward pool)
- Minimum 1 DORK transfer for bonus eligibility
- `transferNoBonus()` for direct transfers
- `tokenURI()` with updateable metadata
- Multi-standard token recovery (ERC20/721/1155/404)
- Batch minting up to 1000

### UnicornEcosystemV2 V2.0.0 (Current)
- UUPS upgradeable proxy pattern
- `teamAirdrop()` - Mint NFTs without requiring UCRED
- `teamAirdropBatch()` - Batch airdrop up to 50 recipients
- `clawback()` - Take back NFTs from any wallet
- `clawbackBatch()` - Batch clawback
- `version()` function returns "2.0.0"

### UnicornEcosystem V1.x (Archived)
- Non-upgradeable contract
- Required UCRED for all minting
- No clawback functionality

---

## Documentation

- **Google Doc:** [Unicorn Ecosystem - Smart Contract Documentation](https://docs.google.com/document/d/1u48_iZNh5A70REMAGfuifPO0g_CKn7lcD41w2GbbDTU)

---

## License

MIT

---

## Acknowledgments

- Built with patterns from [SuperFantastic](../SuperFantasticContract/)
- [OpenZeppelin](https://openzeppelin.com/) - Secure smart contract libraries
- [Hardhat](https://hardhat.org/) - Development environment
- [Base](https://base.org/) - L2 blockchain
- [Arbitrum](https://arbitrum.io/) - L2 blockchain
