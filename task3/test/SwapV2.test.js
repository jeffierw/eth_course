const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwapV2", function () {
  let swapV2;
  let weth;
  let token1;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Deploy WETH contract
    const WETH = await ethers.getContractFactory("WETH");
    weth = await WETH.deploy();
    await weth.waitForDeployment();

    // Deploy another ERC20 token contract for token1
    const Token = await ethers.getContractFactory("FAKEETH");
    token1 = await Token.deploy(ethers.parseEther("10000"));
    await token1.waitForDeployment();

    // Deploy SwapV2 contract
    const SwapV2 = await ethers.getContractFactory("SwapV2");
    [owner, addr1, addr2] = await ethers.getSigners();
    swapV2 = await SwapV2.deploy(await weth.getAddress(), await token1.getAddress());
    await swapV2.waitForDeployment();

    // Mint some tokens for testing
    await weth.deposit({ value: ethers.parseEther("1000") });
    await token1.transfer(owner.address, ethers.parseEther("1000"));
    await weth.connect(addr1).deposit({ value: ethers.parseEther("1000") });
    await token1.transfer(addr1.address, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      expect(await swapV2.token0()).to.equal(weth.target);
      expect(await swapV2.token1()).to.equal(token1.target);
    });
  });

  describe("Add Liquidity", function () {
    it("Should add liquidity correctly", async function () {
      const amount0 = ethers.parseEther("10");
      const amount1 = ethers.parseEther("20");

      await weth.approve(swapV2.target, amount0);
      await token1.approve(swapV2.target, amount1);

      await expect(swapV2.addLiquidity(amount0, amount1))
        .to.emit(swapV2, "Mint")
        .withArgs(owner.address, amount0, amount1);

      expect(await swapV2.reserve0()).to.equal(amount0);
      expect(await swapV2.reserve1()).to.equal(amount1);
    });
  });

  describe("Remove Liquidity", function () {
    it("Should remove liquidity correctly", async function () {
      const amount0 = ethers.parseEther("10");
      const amount1 = ethers.parseEther("20");

      await weth.approve(swapV2.target, amount0);
      await token1.approve(swapV2.target, amount1);
      await swapV2.addLiquidity(amount0, amount1);

      const liquidity = await swapV2.balanceOf(owner.address);
      await expect(swapV2.removeLiquidity(liquidity))
        .to.emit(swapV2, "Burn")
        .withArgs(owner.address, amount0, amount1);

      expect(await swapV2.reserve0()).to.equal(0);
      expect(await swapV2.reserve1()).to.equal(0);
    });
  });

  describe("Swap", function () {
    beforeEach(async function () {
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await weth.approve(swapV2.target, amount0);
      await token1.approve(swapV2.target, amount1);
      await swapV2.addLiquidity(amount0, amount1);
    });

    it("Should swap WETH for token1 correctly", async function () {
      const swapAmount = ethers.parseEther("10");
      await weth.connect(addr1).approve(swapV2.target, swapAmount);

      const expectedOutput = await swapV2.getAmountOut(swapAmount, await swapV2.reserve0(), await swapV2.reserve1());

      await expect(swapV2.connect(addr1).swap(swapAmount, weth.target, 0))
        .to.emit(swapV2, "Swap")
        .withArgs(addr1.address, swapAmount, weth.target, expectedOutput, token1.target);

      expect(await token1.balanceOf(addr1.address)).to.equal(ethers.parseEther("1000") + BigInt(expectedOutput));
    });

    it("Should swap token1 for WETH correctly", async function () {
      const swapAmount = ethers.parseEther("20");
      await token1.connect(addr1).approve(swapV2.target, swapAmount);

      const expectedOutput = await swapV2.getAmountOut(swapAmount, await swapV2.reserve1(), await swapV2.reserve0());

      await expect(swapV2.connect(addr1).swap(swapAmount, token1.target, 0))
        .to.emit(swapV2, "Swap")
        .withArgs(addr1.address, swapAmount, token1.target, expectedOutput, weth.target);

      expect(await weth.balanceOf(addr1.address)).to.equal(ethers.parseEther("1000") + BigInt(expectedOutput));
    });
  });
});
