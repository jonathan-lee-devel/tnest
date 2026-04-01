import { of } from 'rxjs';
import type { ClientProxy } from '@nestjs/microservices';
import { ClientProxyFactory } from '@nestjs/microservices';
import { TypedClientFactory } from '../typed-client-factory';
import { TypedClient } from '../typed-client';
import type { Command } from '../../contracts/command';
import type { ContractRegistry } from '../../contracts/utility-types';

interface TestRegistry extends ContractRegistry {
  'test.cmd': Command<'test.cmd', string, number>;
}

describe('TypedClientFactory', () => {
  let factory: TypedClientFactory;

  beforeEach(() => {
    factory = new TypedClientFactory();
  });

  it('creates a TypedClient from a ClientProxy instance', () => {
    const mockProxy = {
      send: jest.fn().mockReturnValue(of(undefined)),
      emit: jest.fn().mockReturnValue(of(undefined)),
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
    } as unknown as ClientProxy;

    const client = factory.create<TestRegistry>(mockProxy);

    expect(client).toBeInstanceOf(TypedClient);
  });

  it('creates a TypedClient from ClientOptions using ClientProxyFactory', () => {
    const mockProxy = {
      send: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
      close: jest.fn(),
    } as unknown as ClientProxy;

    jest.spyOn(ClientProxyFactory, 'create').mockReturnValue(mockProxy);

    const client = factory.create<TestRegistry>({ transport: 0 });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ClientProxyFactory.create).toHaveBeenCalledWith({ transport: 0 });
    expect(client).toBeInstanceOf(TypedClient);
  });
});
