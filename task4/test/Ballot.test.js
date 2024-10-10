const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Ballot", function () {
  let Ballot;
  let ballot;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let startTime;
  let endTime;

  beforeEach(async function () {
    Ballot = await ethers.getContractFactory("Ballot");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const proposalNames = [
      ethers.encodeBytes32String("Proposal 1"),
      ethers.encodeBytes32String("Proposal 2"),
      ethers.encodeBytes32String("Proposal 3")
    ];
    
    startTime = await time.latest() + 60; // 60秒后开始
    endTime = startTime + 3600; // 1小时后结束
    
    ballot = await Ballot.deploy(proposalNames, startTime, endTime);
    await ballot.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the correct chairperson", async function () {
      expect(await ballot.chairperson()).to.equal(owner.address);
    });

    it("should correctly initialize proposals", async function () {
      const proposal = await ballot.proposals(0);
      expect(ethers.decodeBytes32String(proposal.name)).to.equal("Proposal 1");
      expect(proposal.voteCount).to.equal(0);
    });

    it("should set the correct start and end times", async function () {
      const startTime = await ballot.startTime();
      const endTime = await ballot.endTime();
      expect(endTime).to.be.gt(startTime);
      expect(endTime - startTime).to.equal(3600);
    });
  });

  describe("Voting rights", function () {
    it("should allow chairperson to give voting rights", async function () {
      await ballot.giveRightToVote(addr1.address);
      const voter = await ballot.voters(addr1.address);
      expect(voter.weight).to.equal(1);
    });

    it("should not allow non-chairperson to give voting rights", async function () {
      await expect(ballot.connect(addr1).giveRightToVote(addr2.address))
        .to.be.revertedWith("Only chairperson can give right to vote.");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await ballot.giveRightToVote(addr1.address);
    });

    it("should not allow voting before the voting period starts", async function () {
      await expect(ballot.connect(addr1).vote(1))
        .to.be.revertedWith("Voting period is not active");
    });

    it("should allow voters to vote during the voting period", async function () {
      await time.increaseTo(startTime);
      await ballot.connect(addr1).vote(1);
      const voter = await ballot.voters(addr1.address);
      expect(voter.voted).to.equal(true);
      expect(voter.vote).to.equal(1);
    });

    it("should not allow voting after the voting period ends", async function () {
      await time.increaseTo(endTime + 1);
      await expect(ballot.connect(addr1).vote(1))
        .to.be.revertedWith("Voting period is not active");
    });

    it("should not allow double voting", async function () {
      await time.increaseTo(startTime);
      await ballot.connect(addr1).vote(1);
      await expect(ballot.connect(addr1).vote(2))
        .to.be.revertedWith("Already voted.");
    });
  });

  describe("Delegation", function () {
    beforeEach(async function () {
      await ballot.giveRightToVote(addr1.address);
      await ballot.giveRightToVote(addr2.address);
    });

    it("should allow delegation of vote during the voting period", async function () {
      await time.increaseTo(startTime);
      await ballot.connect(addr1).delegate(addr2.address);
      const voter = await ballot.voters(addr1.address);
      expect(voter.voted).to.equal(true);
      expect(voter.delegate).to.equal(addr2.address);
    });

    it("should not allow delegation before the voting period starts", async function () {
      await expect(ballot.connect(addr1).delegate(addr2.address))
        .to.be.revertedWith("Voting period is not active");
    });

    it("should not allow delegation after the voting period ends", async function () {
      await time.increaseTo(endTime + 1);
      await expect(ballot.connect(addr1).delegate(addr2.address))
        .to.be.revertedWith("Voting period is not active");
    });

    it("should not allow self-delegation", async function () {
      await time.increaseTo(startTime);
      await expect(ballot.connect(addr1).delegate(addr1.address))
        .to.be.revertedWith("Self-delegation is disallowed.");
    });
  });

  describe("Winning proposal", function () {
    beforeEach(async function () {
      await ballot.giveRightToVote(addr1.address);
      await ballot.giveRightToVote(addr2.address);

      // 确保我们在投票期间内
      await time.increaseTo(startTime + 1);

      await ballot.connect(addr1).vote(1);
      await ballot.connect(addr2).vote(2);
    });

    it("should correctly calculate the winning proposal", async function () {
      const winningProposal = await ballot.winningProposal();
      expect(winningProposal).to.equal(1);
    });

    it("should return the name of the winning proposal", async function () {
      const winnerName = await ballot.winnerName();
      expect(ethers.decodeBytes32String(winnerName)).to.equal("Proposal 2");
    });
  });

  describe("Set voter weight", function () {
    it("should allow chairperson to set voter weight outside voting period", async function () {
      await ballot.setVoterWeight(addr1.address, 2);
      const voter = await ballot.voters(addr1.address);
      expect(voter.weight).to.equal(2);
    });

    it("should not allow chairperson to set voter weight during voting period", async function () {
      await time.increaseTo(startTime);
      await expect(ballot.setVoterWeight(addr1.address, 2))
        .to.be.revertedWith("Cannot set weight during voting period");
    });

    it("should not allow non-chairperson to set voter weight", async function () {
      await expect(ballot.connect(addr1).setVoterWeight(addr2.address, 2))
        .to.be.revertedWith("Only the chairperson can set voting weight");
    });

  });
});
