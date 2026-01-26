# Unicorn Ecosystem

A token ecosystem for claiming Unicorn subdomains and community membership NFTs on Base and Arbitrum.

## Overview

The Unicorn Ecosystem consists of two smart contracts that work together:

1. **UnicornCredit (UCRED)** - An ERC20 utility token used to claim subdomains
2. **UnicornEcosystemV2** - A UUPS upgradeable ERC721 contract containing soulbound Subdomain NFTs and Community NFTs

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

### Arbitrum Mainnet

| Contract | Address | Type | Verified |
|----------|---------|------|----------|
| **UnicornCredit (UCRED)** | [`0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6`](https://arbiscan.io/address/0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6#code) | ERC20 | Yes |
| **UnicornEcosystemV2 (Proxy)** | [`0x4927FF835C17495bf209740d1912987445A6dee6`](https://arbiscan.io/address/0x4927FF835C17495bf209740d1912987445A6dee6) | UUPS Proxy | Yes |
| **UnicornEcosystemV2 (Impl)** | [`0xD7D6CF0814eaF9E398Bc3221aED6450C2Ea825CC`](https://arbiscan.io/address/0xD7D6CF0814eaF9E398Bc3221aED6450C2Ea825CC#code) | Implementation | Yes |

### Quick Reference

| Chain | UnicornCredit | UnicornEcosystemV2 (Proxy) |
|-------|---------------|----------------------------|
| **Base** | `0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4` | `0xe83eCe78EB0be0721fF47389Ff674aBaC7E4E58d` |
| **Arbitrum** | `0xC6Ab7d37C6554c5De9D8c9345A3e5Bd4344AAdE6` | `0x4927FF835C17495bf209740d1912987445A6dee6` |

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

Both wallets are authorized team minters on **both contracts** on **both chains**:

| Wallet | Address | Role |
|--------|---------|------|
| **ThirdWeb Server** | `0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c` | Server wallet for airdrops |
| **Admin** | `0x7049747E615a1C5C22935D5790a664B7E65D9681` | Additional team minter |

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
│   └── interfaces/
│       └── IUnicornCredit.sol         # Interface for cross-contract calls
├── scripts/
│   ├── deploy.js                      # Original deployment script
│   ├── deployV2.js                    # V2 upgradeable deployment
│   ├── setupV2.js                     # Setup team minters on V2
│   ├── batchAirdrop.js                # Batch airdrop from CSV/JSON
│   ├── mintTokens.js                  # Mint UCRED tokens
│   └── ...
├── test/
│   ├── UnicornCredit.test.js          # 27 tests
│   └── UnicornEcosystem.test.js       # 61 tests (including V2 features)
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

---

## Version History

### V2.0.0 (Current)
- UUPS upgradeable proxy pattern
- `teamAirdrop()` - Mint NFTs without requiring UCRED
- `teamAirdropBatch()` - Batch airdrop up to 50 recipients
- `clawback()` - Take back NFTs from any wallet
- `clawbackBatch()` - Batch clawback
- `version()` function returns "2.0.0"

### V1.x (Archived)
- Non-upgradeable contract
- Required UCRED for all minting
- No clawback functionality

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
