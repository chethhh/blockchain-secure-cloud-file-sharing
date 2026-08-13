const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FileSharing Smart Contract Tests", function () {
  let fileSharing;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const FileSharing = await ethers.getContractFactory("FileSharing");
    fileSharing = await FileSharing.deploy();
    await fileSharing.waitForDeployment();
  });

  it("1. Should upload a file and assign correct fileId and IPFS CID", async function () {
    const cid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
    const tx = await fileSharing.uploadFile(cid);
    await tx.wait();

    const fileCount = await fileSharing.fileCount();
    expect(fileCount).to.equal(1);

    const fileDetails = await fileSharing.getFileDetails(1);
    expect(fileDetails.ipfsHash).to.equal(cid);
  });

  it("2. Should correctly set the contract uploader as owner", async function () {
    const cid = "QmTestCid123";
    await fileSharing.connect(user1).uploadFile(cid);

    const fileDetails = await fileSharing.getFileDetails(1);
    expect(fileDetails.owner).to.equal(user1.address);
  });

  it("3. Should allow owner to grant access to another wallet address", async function () {
    await fileSharing.connect(owner).uploadFile("QmFile1");
    
    await expect(fileSharing.connect(owner).grantAccess(user1.address, 1))
      .to.emit(fileSharing, "AccessGranted")
      .withArgs(1, owner.address, user1.address);
  });

  it("4. Authorized user should return hasAccess = true", async function () {
    await fileSharing.connect(owner).uploadFile("QmFile1");
    await fileSharing.connect(owner).grantAccess(user1.address, 1);

    const hasAccess = await fileSharing.hasAccess(user1.address, 1);
    expect(hasAccess).to.be.true;
  });

  it("5. Unauthorized user should return hasAccess = false", async function () {
    await fileSharing.connect(owner).uploadFile("QmFile1");

    const hasAccess = await fileSharing.hasAccess(user2.address, 1);
    expect(hasAccess).to.be.false;
  });

  it("6. Should allow owner to revoke access and verify user no longer has access", async function () {
    await fileSharing.connect(owner).uploadFile("QmFile1");
    await fileSharing.connect(owner).grantAccess(user1.address, 1);
    expect(await fileSharing.hasAccess(user1.address, 1)).to.be.true;

    await expect(fileSharing.connect(owner).revokeAccess(user1.address, 1))
      .to.emit(fileSharing, "AccessRevoked")
      .withArgs(1, owner.address, user1.address);

    expect(await fileSharing.hasAccess(user1.address, 1)).to.be.false;
  });

  it("7. Should revert when non-owner tries to grant access", async function () {
    await fileSharing.connect(owner).uploadFile("QmFile1");
    
    await expect(
      fileSharing.connect(user1).grantAccess(user2.address, 1)
    ).to.be.revertedWith("FileSharing: Only file owner can perform this action");
  });

  it("8. Should revert when non-owner tries to revoke access", async function () {
    await fileSharing.connect(owner).uploadFile("QmFile1");
    await fileSharing.connect(owner).grantAccess(user1.address, 1);

    await expect(
      fileSharing.connect(user2).revokeAccess(user1.address, 1)
    ).to.be.revertedWith("FileSharing: Only file owner can perform this action");
  });
});
