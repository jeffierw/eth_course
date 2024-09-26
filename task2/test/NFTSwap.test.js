const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTSwap", function () {
  let nftSwap;
  let myNFT;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MyNFT = await ethers.getContractFactory("MyNFT");
    myNFT = await MyNFT.deploy();
    await myNFT.waitForDeployment();

    const NFTSwap = await ethers.getContractFactory("NFTSwap");
    nftSwap = await NFTSwap.deploy();
    await nftSwap.waitForDeployment();
  });

  describe("List NFT", function () {
    it("should successfully list an NFT", async function () {
      await myNFT.mintNFT(addr1.address, "");
      await myNFT.connect(addr1).approve(await nftSwap.getAddress(), 1);

      await expect(nftSwap.connect(addr1).list(await myNFT.getAddress(), 1, ethers.parseEther("1")))
        .to.emit(nftSwap, "List")
        .withArgs(addr1.address, await myNFT.getAddress(), 1, ethers.parseEther("1"));

      const order = await nftSwap.nftList(await myNFT.getAddress(), 1);
      expect(order.owner).to.equal(addr1.address);
      expect(order.price).to.equal(ethers.parseEther("1"));
    });

    it("should fail when listing price is 0", async function () {
      await myNFT.mintNFT(addr1.address, "");
      await myNFT.connect(addr1).approve(await nftSwap.getAddress(), 1);
  
      await expect(nftSwap.connect(addr1).list(await myNFT.getAddress(), 1, 0))
        .to.be.reverted;
    });
  });

  describe("Revoke listing", function () {
    beforeEach(async function () {
      await myNFT.mintNFT(addr1.address, "");
      await myNFT.connect(addr1).approve(await nftSwap.getAddress(), 1);
      await nftSwap.connect(addr1).list(await myNFT.getAddress(), 1, ethers.parseEther("1"));
    });

    it("should successfully revoke a listing", async function () {
      await expect(nftSwap.connect(addr1).revoke(await myNFT.getAddress(), 1))
        .to.emit(nftSwap, "Revoke")
        .withArgs(addr1.address, await myNFT.getAddress(), 1);

      const order = await nftSwap.nftList(await myNFT.getAddress(), 1);
      expect(order.owner).to.equal(ethers.ZeroAddress);
      expect(order.price).to.equal(0);
    });

    it("should fail when non-owner tries to revoke a listing", async function () {
      await expect(nftSwap.connect(addr2).revoke(await myNFT.getAddress(), 1))
        .to.be.revertedWith("Not Owner");
    });
  });

  describe("Update price", function () {
    beforeEach(async function () {
      await myNFT.mintNFT(addr1.address, "");
      await myNFT.connect(addr1).approve(await nftSwap.getAddress(), 1);
      await nftSwap.connect(addr1).list(await myNFT.getAddress(), 1, ethers.parseEther("1"));
    });

    it("should successfully update the price", async function () {
      await expect(nftSwap.connect(addr1).update(await myNFT.getAddress(), 1, ethers.parseEther("2")))
        .to.emit(nftSwap, "Update")
        .withArgs(addr1.address, await myNFT.getAddress(), 1, ethers.parseEther("2"));

      const order = await nftSwap.nftList(await myNFT.getAddress(), 1);
      expect(order.price).to.equal(ethers.parseEther("2"));
    });

    it("should fail when non-owner tries to update the price", async function () {
      await expect(nftSwap.connect(addr2).update(await myNFT.getAddress(), 1, ethers.parseEther("2")))
        .to.be.revertedWith("Not Owner");
    });

    it("should fail when updating price to 0", async function () {
      await expect(nftSwap.connect(addr1).update(await myNFT.getAddress(), 1, 0))
        .to.be.revertedWith("Invalid Price");
    });
  });
});