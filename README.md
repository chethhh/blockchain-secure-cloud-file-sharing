# BLOCKCHAIN-BASED SECURE CLOUD FILE SHARING SYSTEM

A production-ready, decentralized cloud file-sharing application that combines **React.js**, **Node.js/Express**, **MongoDB**, **IPFS (Pinata)**, **Solidity Smart Contracts**, **Hardhat Blockchain**, and **MetaMask**.

---

## 1. PROJECT OVERVIEW

Traditional cloud storage systems (like Google Drive or Dropbox) rely on centralized cloud providers. This creates single points of failure, privacy risks, and potential data tampering.

This project implements a **decentralized, zero-trust cloud file storage and access management architecture**:

1. **Client-Side AES-256-GCM Envelope Encryption**: Files are encrypted with random 256-bit symmetric keys before leaving the server memory for IPFS.
2. **Decentralized Storage (IPFS)**: Encrypted file binaries are stored across IPFS nodes using Pinata, generating an immutable Content Identifier (CID).
3. **Ethereum Blockchain Access Control**: Immutable ownership records, IPFS CIDs, and access permissions are managed via a Solidity smart contract (`FileSharing.sol`).
4. **Multi-Factor Authentication (MFA)**: Multi-step authentication combining bcrypt passwords, email 6-digit OTP codes, and JWT access tokens.
5. **MetaMask Wallet Cryptographic Verification**: EIP-191 personal signature verification prevents wallet impersonation.
6. **Role-Based Access Control (RBAC)**: Fine-grained permissions for Admin, Editor, and Viewer roles.

---

## 2. ARCHITECTURE DIAGRAMS

### High-Level System Architecture
```text
                         ┌───────────────────────┐
                         │   MetaMask Wallet     │
                         └───────────┬───────────┘
                                     │ Ethereum tx / Signatures
                                     ↓
┌──────────────┐             ┌───────────────────┐
│              │   REST API  │                   │
│ React        │────────────>│ Node.js + Express │
│ Frontend     │<────────────│ Backend API       │
│ (Vite)       │             │                   │
└──────┬───────┘             └─────┬─────┬───────┘
       │                           │     │
       │ ethers.js                 │     │ Mongoose & Axios
       ↓                           ↓     ↓
 ┌──────────────┐             ┌────────┐ ┌──────────────┐
 │ Hardhat Local│             │MongoDB │ │IPFS / Pinata │
 │ Blockchain   │             │Database│ │ Storage      │
 └──────────────┘             └────────┘ └──────────────┘
```

### End-to-End File Upload Dataflow
```text
User selects file
       ↓
React sends authenticated request
       ↓
Express Backend verifies JWT & RBAC (Admin/Editor)
       ↓
Multer receives raw file buffer in memory
       ↓
AES-256-GCM Encrypts File Buffer + Envelope Encrypts Key
       ↓
Upload Encrypted Buffer to IPFS (Pinata API) → Receives CID
       ↓
Send transaction to Ethereum Smart Contract: uploadFile(ipfsCid)
       ↓
Smart Contract records (fileId, ipfsCid, ownerWalletAddress)
       ↓
Save metadata & encrypted key to MongoDB
       ↓
Log Audit Activity
       ↓
Return success response to Frontend
```

---

## 3. BEGINNER-FRIENDLY EXPLANATION

### What happens when I upload a file?
1. The server receives your file in memory.
2. It generates a brand-new 256-bit encryption key and scrambles the file using AES-256-GCM.
3. The encrypted file is pinned to IPFS, which assigns it a unique fingerprint (CID).
4. The backend calls the Ethereum smart contract function `uploadFile(cid)`, storing the CID and your wallet address immutably on-chain.
5. File metadata (name, size, CID, encrypted key) is stored in MongoDB.

### What happens when I share a file?
1. You enter the recipient's Ethereum wallet address.
2. The system calls `grantAccess(recipientWallet, fileId)` on the smart contract.
3. The Ethereum transaction executes, emitting an `AccessGranted` event.
4. From that moment, the smart contract function `hasAccess(recipientWallet, fileId)` returns `true`.

### What happens when an authorized user downloads it?
1. The user logs in and requests a file download.
2. The backend queries the smart contract: `hasAccess(userWallet, fileId)`.
3. If `hasAccess` is `false`, access is immediately denied with HTTP 403 Forbidden.
4. If `true`, the backend fetches the encrypted payload from IPFS, decrypts it using the master key, and streams the restored original file to the user's browser.

### What does each storage layer store?
* **Ethereum Blockchain**: Stores `fileId`, `ipfsHash`, `ownerWalletAddress`, and permission mappings (`hasAccess`). It **NEVER** stores raw file content or encryption keys.
* **IPFS**: Stores the **encrypted file binary payload**. Anyone with the CID can download the file from IPFS, but it is unreadable without the AES key.
* **MongoDB**: Stores user accounts, role definitions, original file names, MIME types, file sizes, envelope-encrypted file keys, and audit activity logs.

---

## 4. WINDOWS INSTALLATION & SETUP INSTRUCTIONS

### Prerequisites
* Windows 10/11
* Node.js v18+ or v20+ installed
* MongoDB installed locally (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI
* Google Chrome or Edge with **MetaMask Extension** installed

---

### STEP 1 — Clone / Open Project Directory
```powershell
cd C:\Users\user\.gemini\antigravity\scratch\blockchain-secure-cloud-file-sharing
```

---

### STEP 2 — Setup & Start Hardhat Local Blockchain
Open **Terminal 1**:
```powershell
cd blockchain
npm install
npx hardhat node
```
*Leave Terminal 1 running.* It starts a local Ethereum node at `http://127.0.0.1:8545` and prints 20 development accounts with test ETH.

---

### STEP 3 — Deploy Smart Contract
Open **Terminal 2**:
```powershell
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
*Output:*
```text
FileSharing deployed successfully to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Contract ABI and Deployment Address automatically synced to Backend & Frontend!
```

To run contract tests:
```powershell
npx hardhat test
```

---

### STEP 4 — Setup & Start Express Backend
In **Terminal 2**:
```powershell
cd ../backend
npm install
copy .env.example .env
```

(Optional) Seed default Admin account:
```powershell
npm run seed:admin
```

Start Backend Server:
```powershell
npm run dev
```
*Backend runs on `http://localhost:5000`.*

---

### STEP 5 — Setup & Start React Frontend
Open **Terminal 3**:
```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

### STEP 6 — Configure MetaMask Network & Account
1. Click MetaMask extension → Network selector dropdown → **Add network** → **Add network manually**.
2. Fill in parameters:
   * **Network Name**: Hardhat Local
   * **RPC URL**: `http://127.0.0.1:8545`
   * **Chain ID**: `31337`
   * **Currency Symbol**: ETH
3. Import Account #0 from Hardhat node:
   * Click Account Icon → **Import Account**.
   * Paste Private Key printed by `npx hardhat node` (e.g. `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`).

---

## 5. PINATA & GMAIL SMTP CONFIGURATION

### Pinata IPFS Setup
1. Create a free account at [https://pinata.cloud](https://pinata.cloud).
2. Go to **API Keys** → **New Key** → Select `Admin` scope → Generate.
3. Copy the **JWT Token**.
4. Open `backend/.env` and set:
   ```env
   PINATA_JWT=your_copied_pinata_jwt_token
   ```
*(Note: If no Pinata JWT is supplied, the project automatically falls back to local IPFS simulation mode for offline demoing!)*

### Gmail App Password Setup (MFA OTP Emails)
1. Go to your Google Account → **Security** → Enable **2-Step Verification**.
2. Search **App passwords** → Create a new app password (e.g. name it "FileSharingApp").
3. Copy the generated 16-character code.
4. Update `backend/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```
*(Note: Set `DEV_LOG_OTP=true` to automatically output 6-digit OTP codes in the backend terminal console for quick testing without sending real emails!)*

---

## 6. END-TO-END MANUAL TESTING FLOW

1. **Register User 1**: Open `http://localhost:5173/register` → Register Alice (`alice@example.com`, Role: `Editor`).
2. **Login & OTP**: Login at `/login` → Check backend terminal for 6-digit OTP → Enter OTP on `/verify-otp`.
3. **Connect MetaMask**: Click **Connect MetaMask** in Navbar → Confirm signature request.
4. **Upload File**: Go to `/upload` → Drag & drop a sample document → Click **Encrypt & Upload**.
5. **Verify Artifacts**: Note IPFS CID and Blockchain File ID on success screen.
6. **Register User 2**: Open an incognito browser window → Register Bob (`bob@example.com`, Role: `Viewer`).
7. **Connect MetaMask User 2**: Switch MetaMask account to Account #1 → Connect wallet for Bob.
8. **Grant Access**: Logged in as Alice, go to `/files/<fileId>` → Click **Grant Access** → Enter Bob's wallet address.
9. **Authorized Download**: Logged in as Bob, go to `/shared-files` → Click **Decrypt & Download** → Verify file downloads and decrypts cleanly!
10. **Revoke Access**: Logged in as Alice, click **Revoke On-Chain** for Bob's wallet address.
11. **Verify Blocked Access**: As Bob, attempt to download the file → System denies request with HTTP 403 Forbidden!

---

## 7. API DOCUMENTATION

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | None | Public | Register new user account |
| `POST` | `/api/auth/login` | None | Public | Validate password & send OTP |
| `POST` | `/api/auth/verify-otp` | None | Public | Verify 6-digit OTP & return JWT |
| `POST` | `/api/wallet/nonce` | JWT | All | Get challenge nonce for wallet sign |
| `POST` | `/api/wallet/verify` | JWT | All | Verify signature & bind wallet address |
| `POST` | `/api/files/upload` | JWT | Admin, Editor | Encrypt, pin to IPFS, store on-chain |
| `GET` | `/api/files` | JWT | All | List accessible files |
| `GET` | `/api/files/shared` | JWT | All | List files explicitly shared with wallet |
| `GET` | `/api/files/:id/download` | JWT | Authorized | Verify smart contract, decrypt & stream |
| `POST` | `/api/files/:id/share` | JWT | Owner, Admin | Call `grantAccess` on smart contract |
| `DELETE`| `/api/files/:id/share/:wallet`| JWT | Owner, Admin | Call `revokeAccess` on smart contract |
| `GET` | `/api/activity` | JWT | All | View tamper-evident audit log trail |
| `GET` | `/api/users` | JWT | Admin | View user accounts (Admin only) |

---

## 8. COLLEGE DEMONSTRATION SCRIPT (5–10 MINUTES)

1. **Introduction (1 min)**: "Good morning professors. Today I am demonstrating my major project: Blockchain-Based Secure Cloud File Sharing System..."
2. **Authentication & MFA (2 mins)**: Show user registration and explain email 6-digit OTP verification preventing unauthorized password reuse.
3. **MetaMask Signature (1 min)**: Show connecting MetaMask. Explain EIP-191 signature verification ensuring wallet address ownership.
4. **Encryption & IPFS Upload (2 mins)**: Select a PDF file. Click Upload. Explain: "The file is encrypted in memory using AES-256-GCM. The encrypted binary is pinned to IPFS, returning CID `Qm...`. The CID is registered on Hardhat via smart contract `FileSharing.sol`."
5. **Smart Contract Permission Sharing (2 mins)**: Log into second account. Show that downloading is forbidden. Switch to Owner account, enter second wallet address, and click 'Grant Access'. Show Hardhat terminal emitting `AccessGranted` event.
6. **Decryption & Download (1 min)**: Download file on second account. Demonstrate smooth decryption back into original PDF.
7. **Revocation & Audit Log (1 min)**: Revoke access. Show download blocked immediately. Display Activity Logs showing full audit trail.

---

## 9. PROJECT REPORT MATERIAL

### Abstract
This project presents a decentralized cloud file-sharing architecture integrating Ethereum smart contracts, IPFS, AES-256-GCM envelope encryption, multi-factor authentication (MFA), and Role-Based Access Control (RBAC). It eliminates single points of trust by storing encrypted file payloads on IPFS while enforcing immutable permission verification directly on smart contracts.

### Problem Statement
Centralized cloud storage solutions suffer from single points of failure, vulnerability to cloud insider attacks, lack of transparent access logs, and data manipulation risks. Existing blockchain storage approaches often inefficiently attempt to store raw data on-chain, leading to exorbitant gas costs and storage limitations.

### Proposed System Solution
The proposed system decouples data storage from access control:
- High-volume encrypted data binaries are offloaded to **IPFS**.
- Light, immutable ownership records and access control lists are managed by **Solidity Smart Contracts**.
- Files are encrypted before reaching IPFS using **AES-256-GCM** envelope encryption.
- Authentications enforce **Email OTP MFA** and **EIP-191 MetaMask Signature Verification**.

### Key Advantages
1. Zero-Trust Encryption: Files are encrypted prior to IPFS storage.
2. Cost Efficiency: Only IPFS hashes and access mappings are committed to Ethereum.
3. Immutable Audit Trail: All upload, permission, and access events produce smart contract events and persistent activity logs.
4. Dynamic Access Management: Owners can grant or revoke wallet permissions on-chain in real time.

---

## 10. LICENSE

This project is licensed under the MIT License - free for educational and major engineering project usage.
