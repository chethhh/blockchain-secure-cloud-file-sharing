const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying FileSharing smart contract to network:", hre.network.name);

  const FileSharing = await hre.ethers.getContractFactory("FileSharing");
  const fileSharing = await FileSharing.deploy();
  await fileSharing.waitForDeployment();

  const contractAddress = await fileSharing.getAddress();
  console.log("FileSharing deployed successfully to:", contractAddress);

  // Prepare deployment info payload
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString()
  };

  // Sync to backend
  const backendDir = path.join(__dirname, "../../backend/src/blockchain");
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(backendDir, "contractAddress.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Sync ABI to backend & frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/FileSharing.sol/FileSharing.json");
  if (fs.existsSync(artifactPath)) {
    const artifactData = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(
      path.join(backendDir, "FileSharingABI.json"),
      JSON.stringify(artifactData.abi, null, 2)
    );

    const frontendDir = path.join(__dirname, "../../frontend/src/services");
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(frontendDir, "contractAddress.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );
    fs.writeFileSync(
      path.join(frontendDir, "FileSharingABI.json"),
      JSON.stringify(artifactData.abi, null, 2)
    );
    console.log("Contract ABI and Deployment Address automatically synced to Backend & Frontend!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
