const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsertSort", function () {
  let insertSort;

  beforeEach(async function () {
    const InsertSort = await ethers.getContractFactory("InsertSort");
    insertSort = await InsertSort.deploy();
  });

  it("应该正确排序数组", async function () {
    const unsortedArray = [2, 5, 3, 0];
    const sortedArray = await insertSort.sort(unsortedArray);
    console.log("排序后的数组:", sortedArray);
    expect(sortedArray).to.deep.equal([0, 2, 3, 5]);
  });

  it("应该处理空数组", async function () {
    const emptyArray = [];
    const result = await insertSort.sort(emptyArray);
    console.log("空数组排序结果:", result);
    expect(result).to.deep.equal([]);
  });

  it("应该处理已排序的数组", async function () {
    const sortedArray = [1, 2, 3, 4, 5];
    const result = await insertSort.sort(sortedArray);
    console.log("已排序数组的结果:", result);
    expect(result).to.deep.equal([1, 2, 3, 4, 5]);
  });

  it("应该处理逆序数组", async function () {
    const reversedArray = [5, 4, 3, 2, 1];
    const result = await insertSort.sort(reversedArray);
    console.log("逆序数组排序结果:", result);
    expect(result).to.deep.equal([1, 2, 3, 4, 5]);
  });
});