const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsertSort", function () {
  let insertSort;

  beforeEach(async function () {
    const InsertSort = await ethers.getContractFactory("InsertSort");
    insertSort = await InsertSort.deploy();
  });

  it("should correctly sort the array", async function () {
    const unsortedArray = [2, 5, 3, 0];
    const sortedArray = await insertSort.sort(unsortedArray);
    console.log("Sorted array:", sortedArray);
    expect(sortedArray).to.deep.equal([0, 2, 3, 5]);
  });

  it("should handle empty array", async function () {
    const emptyArray = [];
    const result = await insertSort.sort(emptyArray);
    console.log("Empty array sorting result:", result);
    expect(result).to.deep.equal([]);
  });

  it("should handle already sorted array", async function () {
    const sortedArray = [1, 2, 3, 4, 5];
    const result = await insertSort.sort(sortedArray);
    console.log("Result of already sorted array:", result);
    expect(result).to.deep.equal([1, 2, 3, 4, 5]);
  });

  it("should handle reversed array", async function () {
    const reversedArray = [5, 4, 3, 2, 1];
    const result = await insertSort.sort(reversedArray);
    console.log("Reversed array sorting result:", result);
    expect(result).to.deep.equal([1, 2, 3, 4, 5]);
  });
});