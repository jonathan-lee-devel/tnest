// Module
export { TnestModule } from './tnest.module';

// Constants & tokens
export { TNEST_OPTIONS, getClientToken } from './constants';

// Contracts
export type {
  Command,
  Event,
  Query,
  AnyContract,
  ContractRegistry,
  ValidateRegistry,
  PatternOf,
  PayloadOf,
  ResponseOf,
  CommandsOf,
  EventsOf,
  QueriesOf,
  CommandPatterns,
  EventPatterns,
  QueryPatterns,
  SendablePatterns,
} from './contracts';
export { command, event, query, defineRegistry } from './contracts';

// Client
export { TypedClient } from './client';
export { TypedClientFactory } from './client';

// Handlers
export { TypedMessagePattern } from './handlers';
export { TypedEventPattern } from './handlers';
export type { TypedMessageHandler, TypedEventHandler } from './handlers';

// Interfaces
export type {
  TnestClientDefinition,
  TnestModuleOptions,
  TnestOptionsFactory,
  TnestModuleAsyncOptions,
} from './interfaces';

// Validation
export { ValidateContract } from './validation';
export { CONTRACT_VALIDATOR } from './validation';
export type { ContractValidator } from './validation';

// Serialization
export { DefaultPayloadSerializer, PAYLOAD_SERIALIZER, PAYLOAD_DESERIALIZER } from './serialization';
export type { PayloadSerializer, PayloadDeserializer } from './serialization';

// Testing
export { MockTypedClient } from './testing';
export { TestContractModule } from './testing';