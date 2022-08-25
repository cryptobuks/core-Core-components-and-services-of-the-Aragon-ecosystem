import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {getContractAddress} from './helpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, ethers} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();

  const ret = await deploy('AddressListVotingManager', {
    from: deployer,
    log: true,
  });

  const addressListVotingManagerAddress: string =
    ret.receipt?.contractAddress || '';
  const managingDAOAddress = await getContractAddress('DAO', hre);
  const pluginRepoFactoryAddress = await getContractAddress(
    'PluginRepoFactory',
    hre
  );
  const pluginRepoFactoryContract = await ethers.getContractAt(
    'PluginRepoFactory',
    pluginRepoFactoryAddress
  );
  await pluginRepoFactoryContract.createPluginRepoWithVersion(
    'AddressListVoting',
    [1, 0, 0],
    addressListVotingManagerAddress,
    '0x00',
    managingDAOAddress
  );
};
export default func;
func.tags = ['AddressListVotingManager'];
