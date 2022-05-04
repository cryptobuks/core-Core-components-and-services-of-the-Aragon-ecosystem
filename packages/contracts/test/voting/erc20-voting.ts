import chai, { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chaiUtils from '../test-utils';
import { VoterState, EVENTS, pct16, toBn } from '../test-utils/voting';
import { customError, ERRORS } from '../test-utils/custom-error-helper';

chai.use(chaiUtils);

import { ERC20Voting, DAOMock } from '../../typechain';
import ERC20Governance from '../../artifacts/contracts/tokens/GovernanceERC20.sol/GovernanceERC20.json';

const { deployMockContract } = waffle;

describe('ERC20Voting', function () {
  let signers: SignerWithAddress[];
  let voting: ERC20Voting;
  let daoMock: DAOMock;
  let erc20VoteMock: any;
  let ownerAddress: string;
  let dummyActions: any;

  before(async () => {
    signers = await ethers.getSigners();
    ownerAddress = await signers[0].getAddress();

    dummyActions = [
      {
        to: ownerAddress,
        data: '0x00000000',
        value: 0,
      },
    ];

    const DAOMock = await ethers.getContractFactory('DAOMock');
    daoMock = await DAOMock.deploy(ownerAddress);
  });

  beforeEach(async () => {
    erc20VoteMock = await deployMockContract(signers[0], ERC20Governance.abi);

    const ERC20Voting = await ethers.getContractFactory('ERC20Voting');
    voting = await ERC20Voting.deploy();
  });

  function initializeVoting(
    participationRequired: any,
    supportRequired: any,
    minDuration: any
  ) {
    return voting.initialize(
      daoMock.address,
      ethers.constants.AddressZero,
      participationRequired,
      supportRequired,
      minDuration,
      erc20VoteMock.address
    );
  }

  describe('initialize: ', async () => {
    it('reverts if trying to re-initialize', async () => {
      await initializeVoting(1, 2, 3);

      await expect(
        initializeVoting(2, 1, 3)
      ).to.be.revertedWith(
        ERRORS.ALREADY_INITIALIZED
      );
    });

    it('reverts if min duration is 0', async () => {
      await expect(
        initializeVoting(1, 2, 0)
      ).to.be.revertedWith(customError('VoteDurationZero'));
    });
  });

  describe('StartVote', async () => {
    let minDuration = 3;
    beforeEach(async () => {
      await initializeVoting(1, 2, minDuration);
    });

    it('reverts total token supply while creating a vote is 0', async () => {
      await erc20VoteMock.mock.getPastTotalSupply.returns(0);
      await expect(
        voting.newVote('0x00', [], 0, 0, false, VoterState.None)
      ).to.be.revertedWith(customError('ZeroValueNotAllowed'));
    });

    it('reverts if vote duration is less than minDuration', async () => {
      await erc20VoteMock.mock.getPastTotalSupply.returns(1);
      const block = await ethers.provider.getBlock('latest');
      const current = block.timestamp;
      const startDate = block.timestamp;
      const endDate = startDate + (minDuration - 1);
      await expect(
        voting.newVote(
          '0x00',
          [],
          startDate,
          endDate,
          false,
          VoterState.None
        )
      ).to.be.revertedWith(customError('VoteTimesForbidden', current + 1, // TODO hacky
        startDate, endDate, minDuration));
    });

    it('should create a vote successfully, but not vote', async () => {
      await erc20VoteMock.mock.getPastTotalSupply.returns(1);
      await erc20VoteMock.mock.getPastVotes.returns(0);

      expect(await voting.newVote('0x00', dummyActions, 0, 0, false, VoterState.None))
        .to.emit(voting, EVENTS.START_VOTE)
        .withArgs(0, ownerAddress, '0x00');

      const block = await ethers.provider.getBlock('latest');

      const vote = await voting.getVote(0);
      expect(vote.open).to.equal(true);
      expect(vote.executed).to.equal(false);
      expect(vote.supportRequired).to.equal(2);
      expect(vote.participationRequired).to.equal(1);
      expect(vote.snapshotBlock).to.equal(block.number - 1);
      expect(vote.votingPower).to.equal(1);
      expect(vote.yea).to.equal(0);
      expect(vote.nay).to.equal(0);

      expect(vote.startDate.add(minDuration)).to.equal(vote.endDate);

      expect(await voting.canVote(1, ownerAddress)).to.equal(false);

      expect(vote.actions).to.eql([
        [dummyActions[0].to, toBn(dummyActions[0].value), dummyActions[0].data],
      ]);
    });

    it('should create a vote and cast a vote immediately', async () => {
      await erc20VoteMock.mock.getPastTotalSupply.returns(1);
      await erc20VoteMock.mock.getPastVotes.returns(1);

      expect(await voting.newVote('0x00', dummyActions, 0, 0, false, VoterState.Yea))
        .to.emit(voting, EVENTS.START_VOTE)
        .withArgs(0, ownerAddress, '0x00')
        .to.emit(voting, EVENTS.CAST_VOTE)
        .withArgs(0, ownerAddress, VoterState.Yea, 1);

      const block = await ethers.provider.getBlock('latest');

      const vote = await voting.getVote(0);
      expect(vote.open).to.equal(true);
      expect(vote.executed).to.equal(false);
      expect(vote.supportRequired).to.equal(2);
      expect(vote.participationRequired).to.equal(1);
      expect(vote.snapshotBlock).to.equal(block.number - 1);
      expect(vote.votingPower).to.equal(1);
      expect(vote.yea).to.equal(1);
      expect(vote.nay).to.equal(0);
      expect(vote.abstain).to.equal(0);
    });
  });

  describe('Vote + Execute:', async () => {
    let minDuration = 500;
    let supportRequiredPct = pct16(50);
    let participationRequiredPct = pct16(20);
    let votingPower = 100;

    beforeEach(async () => {
      await initializeVoting(participationRequiredPct, supportRequiredPct, minDuration);

      // set voting power to 100
      await erc20VoteMock.mock.getPastTotalSupply.returns(votingPower);

      await voting.newVote('0x00', dummyActions, 0, 0, false, VoterState.None);
    });

    it('should not be able to vote if user has 0 token', async () => {
      await erc20VoteMock.mock.getPastVotes.returns(0);

      await expect(voting.vote(0, VoterState.Yea, false)).to.be.revertedWith(
        customError('VoteCastForbidden', 0, ownerAddress)
      );
    });

    it('increases the yea, nay, abstain votes and emit correct events', async () => {
      await erc20VoteMock.mock.getPastVotes.returns(1);

      expect(await voting.vote(0, VoterState.Yea, false))
        .to.emit(voting, EVENTS.CAST_VOTE)
        .withArgs(0, ownerAddress, VoterState.Yea, 1);

      let vote = await voting.getVote(0);
      expect(vote.yea).to.equal(1);
      expect(vote.nay).to.equal(0);
      expect(vote.abstain).to.equal(0);

      expect(await voting.vote(0, VoterState.Nay, false))
        .to.emit(voting, EVENTS.CAST_VOTE)
        .withArgs(0, ownerAddress, VoterState.Nay, 1);

      vote = await voting.getVote(0);
      expect(vote.yea).to.equal(0);
      expect(vote.nay).to.equal(1);
      expect(vote.abstain).to.equal(0);

      expect(await voting.vote(0, VoterState.Abstain, false))
        .to.emit(voting, EVENTS.CAST_VOTE)
        .withArgs(0, ownerAddress, VoterState.Abstain, 1);

      vote = await voting.getVote(0);
      expect(vote.yea).to.equal(0);
      expect(vote.nay).to.equal(0);
      expect(vote.abstain).to.equal(1);
    });

    it('should not double-count votes by the same address', async () => {
      await erc20VoteMock.mock.getPastVotes.returns(1);

      // yea still ends up to be 1 here even after voting
      // 2 times from the same wallet.
      await voting.vote(0, VoterState.Yea, false);
      await voting.vote(0, VoterState.Yea, false);
      expect((await voting.getVote(0)).yea).to.equal(1);

      // yea gets removed, nay ends up as 1.
      await voting.vote(0, VoterState.Nay, false);
      await voting.vote(0, VoterState.Nay, false);
      expect((await voting.getVote(0)).nay).to.equal(1);

      // nay gets removed, abstain ends up as 1.
      await voting.vote(0, VoterState.Abstain, false);
      await voting.vote(0, VoterState.Abstain, false);
      expect((await voting.getVote(0)).abstain).to.equal(1);
    });

    it('can execute early if support is large enough', async () => {
      // vote with 50 yea votes, which is NOT enough to make vote executable as supportPct 
      // must be larger than supportRequiredPct = 50
      await erc20VoteMock.mock.getPastVotes.returns(50);

      await voting.vote(0, VoterState.Yea, false);
      expect(await voting.canExecute(0)).to.equal(false);

      // vote with 1 yea vote from another wallet, so that yea votes amount to 51 in total, which is
      // enough to make vote executable as supportPct supportRequiredPct = 50
      await erc20VoteMock.mock.getPastVotes.returns(1);
      await voting.connect(signers[1]).vote(0, VoterState.Yea, false);

      expect(await voting.canExecute(0)).to.equal(true);
    });

    it('can execute if enough yea votes are given depending on yea+nay+abstain total', async () => {
      // vote with 50 yea votes
      await erc20VoteMock.mock.getPastVotes.returns(50);
      await voting.vote(0, VoterState.Yea, false);

      // vote 30 voting nay votes
      await erc20VoteMock.mock.getPastVotes.returns(30);
      await voting.connect(signers[1]).vote(0, VoterState.Nay, false);

      // vote with 10 abstain votes
      await erc20VoteMock.mock.getPastVotes.returns(10);
      await voting.connect(signers[2]).vote(0, VoterState.Abstain, false);

      // closes the vote
      await ethers.provider.send('evm_increaseTime', [minDuration + 10]);
      await ethers.provider.send('evm_mine', []);

      //The vote is executable as supportPct > 50%, participationPct > 20%, and the voting period is over
      expect(await voting.canExecute(0)).to.equal(true);
    });

    it("cannot execute if enough yea isn't given depending on yea + nay + abstain total", async () => {
      // vote with 10 yea votes
      await erc20VoteMock.mock.getPastVotes.returns(10);
      await voting.vote(0, VoterState.Yea, false);

      // vote with 5 nay votes
      await erc20VoteMock.mock.getPastVotes.returns(5);
      await voting.connect(signers[1]).vote(0, VoterState.Nay, false);

      // vote with 5 abstain votes
      await erc20VoteMock.mock.getPastVotes.returns(5);
      await voting.connect(signers[2]).vote(0, VoterState.Abstain, false);

      // closes the vote
      await ethers.provider.send('evm_increaseTime', [minDuration + 10]);
      await ethers.provider.send('evm_mine', []);

      //The vote is not executable because the participationPct with 20% is still too low, despite a support of 66% and the voting period being over 
      expect(await voting.canExecute(0)).to.equal(false);
    });

    it('executes the vote immediately while final yea is given', async () => {
      // vote with supportRequired staking, so
      // it immediatelly executes the vote
      await erc20VoteMock.mock.getPastVotes.returns(51);

      // supports and should execute right away.
      expect(await voting.vote(0, VoterState.Yea, true))
        .to.emit(daoMock, EVENTS.EXECUTED)
        .withArgs(
          voting.address,
          0,
          [
            [
              dummyActions[0].to,
              ethers.BigNumber.from(dummyActions[0].value),
              dummyActions[0].data,
            ],
          ],
          []
        );

      const vote = await voting.getVote(0);

      expect(vote.executed).to.equal(true);

      // calling execute again should fail
      await expect(voting.execute(0)).to.be.revertedWith(
        customError('VoteExecutionForbidden', 0)
      );
    });

    it('reverts if vote is executed while enough yea is not given ', async () => {
      await expect(voting.execute(0)).to.be.revertedWith(
        customError('VoteExecutionForbidden', 0)
      );
    });
  });

  describe('Configurations for different use cases', async () => {
    describe('A simple majority vote with >50% support and >25% participation required', async () => {
      let minDuration = 500;
      let supportRequiredPct = pct16(50);
      let participationRequiredPct = pct16(25);
      let votingPower = 100;

      beforeEach(async () => {
        await initializeVoting(participationRequiredPct, supportRequiredPct, minDuration);

        // set voting power to 100
        await erc20VoteMock.mock.getPastTotalSupply.returns(votingPower);

        await voting.newVote('0x00', dummyActions, 0, 0, false, VoterState.None);
      });

      it('does not execute if support is high enough but participation and approval (absolute support) are too low', async () => {
        await erc20VoteMock.mock.getPastVotes.returns(10);
        // app ! dur | par | sup
        // 10% !  0  | 10% | 100%
        //  ✓  !  𐄂  |  𐄂  |  ✓ 
        expect(await voting.canExecute(0)).to.equal(false); // Reason: approval and participation are too low

        await ethers.provider.send('evm_increaseTime', [minDuration + 10]);
        await ethers.provider.send('evm_mine', []);
        // app ! dur | par | sup
        // 10% ! 510 | 10% | 100%
        //  𐄂  !  ✓  |  𐄂  |  ✓ 
        expect(await voting.canExecute(0)).to.equal(false); // vote end does not help
      });

      it('does not execute if participation is high enough but support is too low', async () => {
        await erc20VoteMock.mock.getPastVotes.returns(10);
        await voting.connect(signers[0]).vote(0, VoterState.Yea, false);
        
        await erc20VoteMock.mock.getPastVotes.returns(20);
        await voting.connect(signers[1]).vote(0, VoterState.Nay, false);
        // app ! dur | par | sup
        // 30% !  0  | 30% | 33%
        //  𐄂  !  𐄂  |  ✓  |  𐄂 
        expect(await voting.canExecute(0)).to.equal(false); // approval too low, duration and support criterium are not met

        await ethers.provider.send('evm_increaseTime', [minDuration + 10]);
        await ethers.provider.send('evm_mine', []);
        // app ! dur | par | sup
        // 30% ! 510 | 30% | 33%
        //  𐄂  !  ✓  |  ✓  |  𐄂 
        expect(await voting.canExecute(0)).to.equal(false); // vote end does not help
      });

      it('executes after the duration if participation, and support criteria are met', async () => {
        await erc20VoteMock.mock.getPastVotes.returns(30);
        await voting.connect(signers[0]).vote(0, VoterState.Yea, false);
        // app ! dur | par | sup
        // 30% !  0  | 30% | 100%
        //  𐄂  !  𐄂  |  ✓  |  ✓ 
        expect(await voting.canExecute(0)).to.equal(false); // Reason: duration criterium is not met

        await ethers.provider.send('evm_increaseTime', [minDuration + 10]);
        await ethers.provider.send('evm_mine', []);
        // app ! dur | par | sup
        // 30% ! 510 | 30% | 100%
        //  𐄂  !  ✓  |  ✓  |  ✓ 
        expect(await voting.canExecute(0)).to.equal(true); // all criteria are met
      });

      it('executes early if the approval (absolute support) exceeds the required support (assuming the latter is > 50%)', async () => {
        await erc20VoteMock.mock.getPastVotes.returns(50);
        await voting.connect(signers[0]).vote(0, VoterState.Yea, false);
        // app ! dur | par | sup
        // 50% !  0  | 50% | 100%
        //  𐄂  !  𐄂  |  ✓  |  ✓ 
        expect(await voting.canExecute(0)).to.equal(false); // Reason: app > supReq == false

        await erc20VoteMock.mock.getPastVotes.returns(10);
        await voting.connect(signers[1]).vote(0, VoterState.Yea, false);
        // app ! dur | par | sup
        // 60% !  0  | 60% | 100%
        //  ✓  !  𐄂  |  ✓  |  ✓ 
        expect(await voting.canExecute(0)).to.equal(true); // Correct because more voting doesn't change the outcome

        await erc20VoteMock.mock.getPastVotes.returns(40);
        await voting.connect(signers[2]).vote(0, VoterState.Nay, false);
        // app ! dur | par | sup
        // 60% !  0  | 100%| 60%
        //  ✓  !  𐄂  |  ✓  |  ✓ 
        expect(await voting.canExecute(0)).to.equal(true); // The outcome did not change
      });
    });
  });
});
