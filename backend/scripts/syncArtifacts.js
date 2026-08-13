const fs = require('fs');
const path = require('path');

console.log('[Artifact Sync] Syncing Hardhat smart contract artifacts to backend and frontend...');

const artifactPath = path.join(__dirname, '../../blockchain/artifacts/contracts/FileSharing.sol/FileSharing.json');
const backendDestDir = path.join(__dirname, '../src/blockchain');
const frontendDestDir = path.join(__dirname, '../../frontend/src/services');

if (!fs.existsSync(artifactPath)) {
  console.warn('[Artifact Sync Warning] Hardhat compilation output not found. Run `npm run compile` or `npx hardhat run scripts/deploy.js --network localhost` in the `blockchain` directory first.');
  process.exit(0);
}

try {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  if (!fs.existsSync(backendDestDir)) fs.mkdirSync(backendDestDir, { recursive: true });
  if (!fs.existsSync(frontendDestDir)) fs.mkdirSync(frontendDestDir, { recursive: true });

  fs.writeFileSync(path.join(backendDestDir, 'FileSharingABI.json'), JSON.stringify(artifact.abi, null, 2));
  fs.writeFileSync(path.join(frontendDestDir, 'FileSharingABI.json'), JSON.stringify(artifact.abi, null, 2));

  console.log('[Artifact Sync] Successfully synced FileSharingABI.json to backend and frontend!');
} catch (err) {
  console.error('[Artifact Sync Error]', err.message);
}
