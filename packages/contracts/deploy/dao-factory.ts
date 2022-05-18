import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {getContractAddress} from './helpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();

  const registryAddr = await getContractAddress('Registry', hre);
  const tokenFactory = await getContractAddress('TokenFactory', hre);

  await deploy('DAOFactory', {
    from: deployer,
    args: [registryAddr, tokenFactory],
    log: true,
  });
};
export default func;
func.runAtTheEnd = true;
func.tags = ['DAOFactory'];
