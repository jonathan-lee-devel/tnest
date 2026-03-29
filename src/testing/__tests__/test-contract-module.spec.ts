import { Test } from '@nestjs/testing';
import { TestContractModule } from '../test-contract-module';
import { MockTypedClient } from '../mock-typed-client';
import { TypedClientFactory } from '../../client';
import { getClientToken } from '../../constants';
import type { Command } from '../../contracts/command';
import type { ContractRegistry } from '../../contracts/utility-types';

interface TestRegistry extends ContractRegistry {
  'test.cmd': Command<'test.cmd', string, number>;
}

describe('TestContractModule', () => {
  it('registers mock clients as injectable by token', async () => {
    const mockClient = new MockTypedClient<TestRegistry>();

    const module = await Test.createTestingModule({
      imports: [
        TestContractModule.register([
          { name: 'TEST_SERVICE', mock: mockClient as MockTypedClient<never> },
        ]),
      ],
    }).compile();

    const token = getClientToken('TEST_SERVICE');
    const resolved = module.get(token);
    expect(resolved).toBe(mockClient);
  });

  it('provides TypedClientFactory', async () => {
    const module = await Test.createTestingModule({
      imports: [TestContractModule.register([])],
    }).compile();

    const factory = module.get(TypedClientFactory);
    expect(factory).toBeInstanceOf(TypedClientFactory);
  });
});
