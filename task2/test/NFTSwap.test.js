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

  describe("上架NFT", function () {
    it("应该能成功上架NFT", async function () {
      await myNFT.mintNFT(addr1.address, "");
      await myNFT.connect(addr1).approve(await nftSwap.getAddress(), 1);

      await expect(nftSwap.connect(addr1).list(await myNFT.getAddress(), 1, ethers.parseEther("1")))
        .to.emit(nftSwap, "List")
        .withArgs(addr1.address, await myNFT.getAddress(), 1, ethers.parseEther("1"));

      const order = await nftSwap.nftList(await myNFT.getAddress(), 1);
      expect(order.owner).to.equal(addr1.address);
      expect(order.price).to.equal(ethers.parseEther("1"));
    });

    it("上架价格为0时应该失败", async function () {
      await myNFT.mintNFT(addr1.address, "");
      await myNFT.connect(addr1).approve(await nftSwap.getAddress(), 1);
  
      await expect(nftSwap.connect(addr1).list(await myNFT.getAddress(), 1, 0))
        .to.be.reverted;
    });
  });

  describe("撤销上架", function () {
    beforeEach(async function () {
      await myNFT.mintNFT(addr1.address, "");
      await myNFT.connect(addr1).approve(await nftSwap.getAddress(), 1);
      await nftSwap.connect(addr1).list(await myNFT.getAddress(), 1, ethers.parseEther("1"));
    });

    it("应该能成功撤销上架", async function () {
      await expect(nftSwap.connect(addr1).revoke(await myNFT.getAddress(), 1))
        .to.emit(nftSwap, "Revoke")
        .withArgs(addr1.address, await myNFT.getAddress(), 1);

      const order = await nftSwap.nftList(await myNFT.getAddress(), 1);
      expect(order.owner).to.equal(ethers.ZeroAddress);
      expect(order.price).to.equal(0);
    });

    it("非所有者撤销上架应该失败", async function () {
      await expect(nftSwap.connect(addr2).revoke(await myNFT.getAddress(), 1))
        .to.be.revertedWith("Not Owner");
    });
  });

  describe("更新价格", function () {
    beforeEach(async function () {
      await myNFT.mintNFT(addr1.address, "");
      await myNFT.connect(addr1).approve(await nftSwap.getAddress(), 1);
      await nftSwap.connect(addr1).list(await myNFT.getAddress(), 1, ethers.parseEther("1"));
    });

    it("应该能成功更新价格", async function () {
      await expect(nftSwap.connect(addr1).update(await myNFT.getAddress(), 1, ethers.parseEther("2")))
        .to.emit(nftSwap, "Update")
        .withArgs(addr1.address, await myNFT.getAddress(), 1, ethers.parseEther("2"));

      const order = await nftSwap.nftList(await myNFT.getAddress(), 1);
      expect(order.price).to.equal(ethers.parseEther("2"));
    });

    it("非所有者更新价格应该失败", async function () {
      await expect(nftSwap.connect(addr2).update(await myNFT.getAddress(), 1, ethers.parseEther("2")))
        .to.be.revertedWith("Not Owner");
    });

    it("更新价格为0应该失败", async function () {
      await expect(nftSwap.connect(addr1).update(await myNFT.getAddress(), 1, 0))
        .to.be.revertedWith("Invalid Price");
    });
  });
});