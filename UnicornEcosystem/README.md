# Unicorn Ecosystem

A token ecosystem for claiming Unicorn subdomains and community membership NFTs on Base.

## Overview

The Unicorn Ecosystem consists of two smart contracts that work together:

1. **UnicornCredit (UCRED)** - An ERC20 utility token used to claim subdomains
2. **UnicornEcosystem** - A combined ERC721 contract containing soulbound Subdomain NFTs and Community NFTs

### How It Works

1. Users receive 1 UCRED token (via airdrop from ThirdWeb server wallet)
2. Users approve the UnicornEcosystem contract to spend their UCRED
3. Users call `claimSubdomain("desiredname")`
4. The contract burns 1 UCRED and mints two soulbound NFTs:
   - **Subdomain NFT** (e.g., "alice.unicorn")
   - **Community NFT** (membership proof)

---

## Deployed Contracts (Base Mainnet)

| Contract | Address | Verified |
|----------|---------|----------|
| **UnicornCredit (UCRED)** | [`0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4`](https://basescan.org/address/0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4#code) | Yes |
| **UnicornEcosystem** | [`0x440A2e63468384Ff72a84d96B03619cBe580d352`](https://basescan.org/address/0x440A2e63468384Ff72a84d96B03619cBe580d352#code) | Yes |

### Deployment Parameters

#### UnicornCredit
- **Name:** UnicornCredit
- **Symbol:** UCRED
- **Decimals:** 18
- **Mint Price:** 0.01 ETH (for public minting)
- **Constructor Arguments:** None

#### UnicornEcosystem
- **Name:** Unicorn Ecosystem
- **Symbol:** UNICORN
- **Constructor Arguments:**
  - `_unicornCredit`: `0x605b108a8D5cC149AB977C3ec37fDDFe3AE9f4B4`
  - `_baseSubdomainImageURI`: `ipfs://QmYourSubdomainImageHash` (placeholder at deploy)
  - `_baseCommunityImageURI`: `ipfs://QmYourCommunityImageHash` (placeholder at deploy)

### Post-Deployment Configuration

| Setting | Value |
|---------|-------|
| **Subdomain Image URI** | `ipfs://bafkreidtgzztbjue3yamvkd7rdh2hxlsbchd3bclc53s37nvgys2f6s4y4` |
| **Community Image URI** | `ipfs://bafkreid4j2yawdwm4ogi63rbzxjmnh4cdx2ljyhuip36gdgmhhl7cjdxiu` |
| **ThirdWeb Server Wallet** | `0x03D2c93762bB7CdC7dC07006c94DFa01368e0f8c` |
| **Domain Suffix** | `.unicorn` |

### Initial Token Distribution

| Wallet | UCRED Balance |
|--------|---------------|
| Server Wallet (`0x03D2...0f8c`) | 300 UCRED |
| `0x7049747E615a1C5C22935D5790a664B7E65D9681` | 1 UCRED |
| **Total Supply** | 301 UCRED |

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

#### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `mint(uint256 amount)` | Public (payable) | Mint UCRED at 0.01 ETH each |
| `teamMint(address to, uint256 amount)` | Team Minter | Free mint for airdrops |
| `batchTeamMint(address[], uint256[])` | Team Minter | Batch airdrop |
| `burn(uint256 amount)` | Token Holder | Burn own tokens |
| `burnFrom(address, uint256)` | Approved | Burn with approval |
| `setTeamMinter(address, bool)` | Owner | Manage team minters |
| `setMintPrice(uint256)` | Owner | Update mint price |
| `pause() / unpause()` | Owner | Emergency controls |
| `withdraw()` | Owner | Withdraw ETH |
| `recoverERC20(address, uint256)` | Owner | Recover stuck tokens |

---

### UnicornEcosystem (ERC721)

A combined NFT contract with two token types:
- **Subdomain NFTs** (Token IDs: 1 to 999,999,999)
- **Community NFTs** (Token IDs: 1,000,000,001+)

Both are **soulbound** (non-transferable).

#### Constants
```solidity
COMMUNITY_TOKEN_OFFSET = 1_000_000_000
MAX_NAME_LENGTH = 32
MIN_NAME_LENGTH = 1
CLAIM_COST = 1e18  // 1 UCRED
MAX_BATCH_SIZE = 50
```

#### Token ID Mapping
When a user claims subdomain #1, they receive:
- Subdomain NFT: Token ID `1`
- Community NFT: Token ID `1,000,000,001`

Formula: `communityTokenId = subdomainTokenId + 1,000,000,000`

#### Name Validation Rules
- Length: 1-32 characters
- Allowed characters: `a-z`, `0-9`, `-` (hyphen)
- Hyphens cannot be at start or end
- Names are normalized to lowercase (e.g., "Alice" → "alice")
- Names must be unique (case-insensitive)

#### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `claimSubdomain(string name)` | Public | Burn 1 UCRED, mint both NFTs |
| `teamClaimFor(address, string)` | Team Minter | Claim on behalf of user |
| `resolveSubdomain(string)` | View | Get owner of subdomain |
| `isNameAvailable(string)` | View | Check if name is available |
| `getSubdomainName(uint256)` | View | Get name for token ID |
| `getFullDomain(uint256)` | View | Get full domain (e.g., "alice.unicorn") |
| `isSubdomainToken(uint256)` | View | Check if token is subdomain |
| `isCommunityToken(uint256)` | View | Check if token is community |
| `setUnicornCredit(address)` | Owner | Update UCRED contract |
| `setTeamMinter(address, bool)` | Owner | Manage team minters |
| `setBaseSubdomainImageURI(string)` | Owner | Update subdomain image |
| `setBaseCommunityImageURI(string)` | Owner | Update community image |
| `setDomainSuffix(string)` | Owner | Update domain suffix |
| `pause() / unpause()` | Owner | Emergency controls |

#### Soulbound Behavior
- Transfers are **blocked** (reverts with "Soulbound: transfers disabled")
- Approvals are **blocked** (reverts with "Soulbound: approvals disabled")
- Only minting (from zero address) and burning (to zero address) are allowed

---

## Usage Guide

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

1. **Airdrop UCRED to user:**
   ```javascript
   await unicornCredit.teamMint(userAddress, 1);
   ```

2. **Option A: User claims themselves** (requires user to approve + call claim)

3. **Option B: Team claims for user** (requires user to have approved):
   ```javascript
   await unicornEcosystem.teamClaimFor(userAddress, "subdomain");
   ```

### For Admins: Managing the System

```javascript
// Add a new team minter
await unicornCredit.setTeamMinter(newMinterAddress, true);
await unicornEcosystem.setTeamMinter(newMinterAddress, true);

// Update image URIs
await unicornEcosystem.setBaseSubdomainImageURI("ipfs://newHash");
await unicornEcosystem.setBaseCommunityImageURI("ipfs://newHash");

// Pause in emergency
await unicornCredit.pause();
await unicornEcosystem.pause();

// Withdraw funds from UnicornCredit (from public mints)
await unicornCredit.withdraw();
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
```

### Compile
```bash
npx hardhat compile
```

### Test
```bash
npx hardhat test
```

### Deploy
```bash
# Base Mainnet
npx hardhat run scripts/deploy.js --network base

# Base Sepolia (testnet)
npx hardhat run scripts/deploy.js --network baseSepolia
```

### Verify
```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> [constructor args...]
```

---

## File Structure

```
UnicornEcosystem/
├── contracts/
│   ├── UnicornCredit.sol           # ERC20 utility token
│   ├── UnicornEcosystem.sol        # Combined NFT contract
│   └── interfaces/
│       └── IUnicornCredit.sol      # Interface for cross-contract calls
├── scripts/
│   ├── deploy.js                   # Main deployment script
│   ├── updateImageURIs.js          # Update NFT images
│   ├── addTeamMinter.js            # Add team minter to both contracts
│   ├── mintTokens.js               # Mint UCRED tokens
│   └── checkBalances.js            # Check token balances
├── test/
│   ├── UnicornCredit.test.js       # 27 tests
│   └── UnicornEcosystem.test.js    # 42 tests
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md
```

---

## Security Features

Both contracts implement security best practices from the SuperFantastic contract:

- **Ownable2Step** - Two-step ownership transfer prevents accidental loss
- **ReentrancyGuard** - Protection against reentrancy attacks
- **CEI Pattern** - Checks-Effects-Interactions ordering
- **Custom Pausable** - Emergency pause functionality
- **Token Recovery** - Recover accidentally sent tokens
- **Input Validation** - Comprehensive parameter checking
- **SafeERC20** - Safe token transfers

---

## Events

### UnicornCredit Events
```solidity
event Minted(address indexed to, uint256 amount);
event TeamMinted(address indexed by, address indexed to, uint256 amount);
event BatchTeamMinted(address indexed by, address[] recipients, uint256[] amounts);
event TeamMinterUpdated(address indexed minter, bool authorized);
event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
event Paused(address account);
event Unpaused(address account);
event NativeTokenWithdrawn(address indexed to, uint256 amount);
event ERC20Recovered(address indexed token, address indexed to, uint256 amount);
event ERC721Recovered(address indexed token, address indexed to, uint256 tokenId);
```

### UnicornEcosystem Events
```solidity
event SubdomainClaimed(address indexed owner, uint256 indexed subdomainTokenId, uint256 indexed communityTokenId, string name);
event TeamClaimExecuted(address indexed by, address indexed recipient, uint256 subdomainTokenId, string name);
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

---

## License

MIT

---

## Acknowledgments

- Built with patterns from [SuperFantastic](../SuperFantasticContract/)
- [OpenZeppelin](https://openzeppelin.com/) - Secure smart contract libraries
- [Hardhat](https://hardhat.org/) - Development environment
- [Base](https://base.org/) - L2 blockchain
