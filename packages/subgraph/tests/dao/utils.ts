import {ethereum, Bytes, Address, BigInt} from '@graphprotocol/graph-ts';
import {createMockedFunction, newMockEvent} from 'matchstick-as/assembly/index';
import {Dao} from '../../generated/schema';

import {
  MetadataSet,
  NativeTokenDeposited,
  Deposited,
  Granted,
  Revoked,
  Frozen,
  Executed
} from '../../generated/templates/DaoTemplate/DAO';

// events

export function createNewMetadataSetEvent(
  metadata: string,
  contractAddress: string
): MetadataSet {
  let newMetadataSetEvent = changetype<MetadataSet>(newMockEvent());

  newMetadataSetEvent.address = Address.fromString(contractAddress);
  newMetadataSetEvent.parameters = [];

  let metadataParam = new ethereum.EventParam(
    'metadata',
    ethereum.Value.fromBytes(Bytes.fromUTF8(metadata))
  );

  newMetadataSetEvent.parameters.push(metadataParam);

  return newMetadataSetEvent;
}

export function createNewNativeTokenDepositedEvent(
  sender: string,
  amount: string,
  contractAddress: string
): NativeTokenDeposited {
  let newEvent = changetype<NativeTokenDeposited>(newMockEvent());

  newEvent.address = Address.fromString(contractAddress);
  newEvent.parameters = [];

  let senderParam = new ethereum.EventParam(
    'sender',
    ethereum.Value.fromAddress(Address.fromString(sender))
  );
  let amountParam = new ethereum.EventParam(
    'amount',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(amount))
  );

  newEvent.parameters.push(senderParam);
  newEvent.parameters.push(amountParam);

  return newEvent;
}

export function createNewDepositedEvent(
  sender: string,
  token: string,
  amount: string,
  reference: string,
  contractAddress: string
): Deposited {
  let newEvent = changetype<Deposited>(newMockEvent());

  newEvent.address = Address.fromString(contractAddress);
  newEvent.parameters = [];

  let senderParam = new ethereum.EventParam(
    'sender',
    ethereum.Value.fromAddress(Address.fromString(sender))
  );
  let tokenParam = new ethereum.EventParam(
    'token',
    ethereum.Value.fromAddress(Address.fromString(token))
  );
  let amountParam = new ethereum.EventParam(
    'amount',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(amount))
  );
  let referenceParam = new ethereum.EventParam(
    '_reference',
    ethereum.Value.fromString(reference)
  );

  newEvent.parameters.push(senderParam);
  newEvent.parameters.push(tokenParam);
  newEvent.parameters.push(amountParam);
  newEvent.parameters.push(referenceParam);

  return newEvent;
}

export function createNewGrantedEvent(
  contractPermissionId: Bytes,
  actor: string,
  who: string,
  where: string,
  oracle: string,
  contractAddress: string
): Granted {
  let newGrantedEvent = changetype<Granted>(newMockEvent());

  newGrantedEvent.address = Address.fromString(contractAddress);
  newGrantedEvent.parameters = [];

  let contractPermissionIdParam = new ethereum.EventParam(
    'contractPermissionId',
    ethereum.Value.fromBytes(contractPermissionId)
  );
  let actorParam = new ethereum.EventParam(
    'actor',
    ethereum.Value.fromAddress(Address.fromString(actor))
  );
  let whoParam = new ethereum.EventParam(
    'who',
    ethereum.Value.fromAddress(Address.fromString(who))
  );
  let whereParam = new ethereum.EventParam(
    'where',
    ethereum.Value.fromAddress(Address.fromString(where))
  );
  let oracleParam = new ethereum.EventParam(
    'oracle',
    ethereum.Value.fromAddress(Address.fromString(oracle))
  );

  newGrantedEvent.parameters.push(contractPermissionIdParam);
  newGrantedEvent.parameters.push(actorParam);
  newGrantedEvent.parameters.push(whoParam);
  newGrantedEvent.parameters.push(whereParam);
  newGrantedEvent.parameters.push(oracleParam);

  return newGrantedEvent;
}

export function createNewRevokedEvent(
  contractPermissionId: Bytes,
  actor: string,
  who: string,
  where: string,
  contractAddress: string
): Revoked {
  let newGrantedEvent = changetype<Revoked>(newMockEvent());

  newGrantedEvent.address = Address.fromString(contractAddress);
  newGrantedEvent.parameters = [];

  let contractPermissionIdParam = new ethereum.EventParam(
    'contractPermissionId',
    ethereum.Value.fromBytes(contractPermissionId)
  );
  let actorParam = new ethereum.EventParam(
    'actor',
    ethereum.Value.fromAddress(Address.fromString(actor))
  );
  let whoParam = new ethereum.EventParam(
    'who',
    ethereum.Value.fromAddress(Address.fromString(who))
  );
  let whereParam = new ethereum.EventParam(
    'where',
    ethereum.Value.fromAddress(Address.fromString(where))
  );

  newGrantedEvent.parameters.push(contractPermissionIdParam);
  newGrantedEvent.parameters.push(actorParam);
  newGrantedEvent.parameters.push(whoParam);
  newGrantedEvent.parameters.push(whereParam);

  return newGrantedEvent;
}

export function createNewFrozenEvent(
  contractPermissionId: Bytes,
  actor: string,
  where: string,
  contractAddress: string
): Frozen {
  let newFrozenEvent = changetype<Frozen>(newMockEvent());

  newFrozenEvent.address = Address.fromString(contractAddress);
  newFrozenEvent.parameters = [];

  let contractPermissionIdParam = new ethereum.EventParam(
    'contractPermissionId',
    ethereum.Value.fromBytes(contractPermissionId)
  );
  let actorParam = new ethereum.EventParam(
    'actor',
    ethereum.Value.fromAddress(Address.fromString(actor))
  );
  let whereParam = new ethereum.EventParam(
    'where',
    ethereum.Value.fromAddress(Address.fromString(where))
  );

  newFrozenEvent.parameters.push(contractPermissionIdParam);
  newFrozenEvent.parameters.push(actorParam);
  newFrozenEvent.parameters.push(whereParam);

  return newFrozenEvent;
}

export function createNewExecutedEvent(
  actor: string,
  callId: string,
  actions: ethereum.Tuple[],
  execResults: Bytes[],
  contractAddress: string
): Executed {
  let newExecutedEvent = changetype<Executed>(newMockEvent());

  newExecutedEvent.address = Address.fromString(contractAddress);
  newExecutedEvent.parameters = [];

  let actorParam = new ethereum.EventParam(
    'actor',
    ethereum.Value.fromAddress(Address.fromString(actor))
  );
  let callIdParam = new ethereum.EventParam(
    'callId',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(callId))
  );
  let actionsParam = new ethereum.EventParam(
    'actions',
    ethereum.Value.fromTupleArray(actions)
  );
  let execResultsParams = new ethereum.EventParam(
    'execResults',
    ethereum.Value.fromBytesArray(execResults)
  );

  newExecutedEvent.parameters.push(actorParam);
  newExecutedEvent.parameters.push(callIdParam);
  newExecutedEvent.parameters.push(actionsParam);
  newExecutedEvent.parameters.push(execResultsParams);

  return newExecutedEvent;
}

// calls

export function getBalanceOf(
  contractAddress: string,
  account: string,
  returns: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'balanceOf',
    'balanceOf(address):(uint256)'
  )
    .withArgs([ethereum.Value.fromAddress(Address.fromString(account))])
    .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString(returns))]);
}

export function getEXECUTE_PERMISSION_ID(
  contractAddress: string,
  returns: Bytes
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'EXECUTE_PERMISSION_ID',
    'EXECUTE_PERMISSION_ID():(bytes32)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromBytes(returns)]);
}

export function getEXECUTE_PERMISSION_IDreverted(
  contractAddress: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'EXECUTE_PERMISSION_ID',
    'EXECUTE_PERMISSION_ID():(bytes32)'
  )
    .withArgs([])
    .reverts();
}

export function getSupportRequiredPct(
  contractAddress: string,
  returns: BigInt
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'supportRequiredPct',
    'supportRequiredPct():(uint64)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromSignedBigInt(returns)]);
}

export function getParticipationRequiredPct(
  contractAddress: string,
  returns: BigInt
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'participationRequiredPct',
    'participationRequiredPct():(uint64)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromSignedBigInt(returns)]);
}

export function getMinDuration(contractAddress: string, returns: BigInt): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'minDuration',
    'minDuration():(uint64)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromSignedBigInt(returns)]);
}

export function getVotesLength(contractAddress: string, returns: BigInt): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'votesLength',
    'votesLength():(uint256)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromSignedBigInt(returns)]);
}

export function getVotingToken(contractAddress: string, returns: string): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'getVotingToken',
    'getVotingToken():(address)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromAddress(Address.fromString(returns))]);
}

export function getIsUserAllowed(
  contractAddress: string,
  address: string,
  returns: boolean
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'isAllowed',
    'isAllowed(address,uint256):(bool)'
  )
    .withArgs([
      ethereum.Value.fromAddress(Address.fromString(address)),
      ethereum.Value.fromUnsignedBigInt(BigInt.zero())
    ])
    .returns([ethereum.Value.fromBoolean(returns)]);
}

export function getAllowedLength(
  contractAddress: string,
  returns: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'allowedLength',
    'allowedLength():(uint64)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString(returns))]);
}

export function getSupportsInterface(
  contractAddress: string,
  interfaceId: string,
  returns: boolean
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'supportsInterface',
    'supportsInterface(bytes4):(bool)'
  )
    .withArgs([
      ethereum.Value.fromFixedBytes(Bytes.fromHexString(interfaceId) as Bytes)
    ])
    .returns([ethereum.Value.fromBoolean(returns)]);
}

// state

export function createDaoEntityState(
  entityID: string,
  creator: string,
  token: string
): Dao {
  let daoEntity = new Dao(entityID);
  daoEntity.creator = Address.fromString(creator);
  daoEntity.createdAt = BigInt.zero();
  daoEntity.token = Address.fromString(token).toHexString();
  daoEntity.save();

  return daoEntity;
}
