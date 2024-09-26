const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WETH", function () {
  let weth;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    const WETH = await ethers.getContractFactory("WETH");
    [owner, addr1, addr2] = await ethers.getSigners();
    weth = await WETH.deploy();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await weth.name()).to.equal("WETH");
      expect(await weth.symbol()).to.equal("WETH");
    });
  });

  describe("Deposit", function () {
    it("Should mint WETH when ETH is sent to the contract", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await addr1.sendTransaction({
        to: weth.target,
        value: depositAmount,
      });
      expect(await weth.balanceOf(addr1.address)).to.equal(depositAmount);
    });

    it("Should emit Deposit event when ETH is deposited", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await expect(weth.connect(addr1).deposit({ value: depositAmount }))
        .to.emit(weth, "Deposit")
        .withArgs(addr1.address, depositAmount);
    });
  });

  describe("Withdraw", function () {
    it("Should burn WETH and return ETH when withdrawing", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await weth.connect(addr1).deposit({ value: depositAmount });
      
      await expect(() => weth.connect(addr1).withdraw(depositAmount)).to.changeEtherBalances(
        [weth, addr1],
        [ethers.parseEther("-1.0"), depositAmount]
      );
      expect(await weth.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should emit Withdrawal event when WETH is withdrawn", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await weth.connect(addr1).deposit({ value: depositAmount });
      
      await expect(weth.connect(addr1).withdraw(depositAmount))
        .to.emit(weth, "Withdrawal")
        .withArgs(addr1.address, depositAmount);
    });

    it("Should revert if trying to withdraw more than balance", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await weth.connect(addr1).deposit({ value: depositAmount });
      
      await expect(weth.connect(addr1).withdraw(ethers.parseEther("2.0")))
        .to.be.reverted;
    });
  });
});
