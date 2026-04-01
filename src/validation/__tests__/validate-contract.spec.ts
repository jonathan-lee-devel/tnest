import 'reflect-metadata';
import { ValidateContract } from '../validate-contract.decorator';
import type { ContractValidator } from '../validator.interface';

describe('ValidateContract', () => {
  it('calls validator.validate() before the handler', async () => {
    const validator: ContractValidator = {
      validate: jest.fn(),
    };

    class TestHandler {
      __contractValidator = validator;

      @ValidateContract()
      handle(payload: unknown): string {
        return `processed: ${String(payload)}`;
      }
    }

    const handler = new TestHandler();
    const result = await (handler.handle as unknown as (payload: unknown) => Promise<string>)(
      'test-data',
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(validator.validate).toHaveBeenCalledWith('test-data');
    expect(result).toBe('processed: test-data');
  });

  it('runs handler without validation when no validator is set', async () => {
    class TestHandler {
      __contractValidator: ContractValidator | undefined = undefined;

      @ValidateContract()
      handle(payload: unknown): string {
        return `processed: ${String(payload)}`;
      }
    }

    const handler = new TestHandler();
    const result = await (handler.handle as unknown as (payload: unknown) => Promise<string>)(
      'test-data',
    );

    expect(result).toBe('processed: test-data');
  });

  it('propagates validation errors', async () => {
    const validator: ContractValidator = {
      validate: jest.fn().mockRejectedValue(new Error('Validation failed')),
    };

    class TestHandler {
      __contractValidator = validator;

      @ValidateContract()
      handle(payload: unknown): string {
        return `processed: ${String(payload)}`;
      }
    }

    const handler = new TestHandler();
    await expect(
      (handler.handle as unknown as (payload: unknown) => Promise<string>)('bad-data'),
    ).rejects.toThrow('Validation failed');
  });

  it('supports synchronous validators', async () => {
    const validator: ContractValidator = {
      validate: jest.fn(),
    };

    class TestHandler {
      __contractValidator = validator;

      @ValidateContract()
      handle(payload: unknown): string {
        return `processed: ${String(payload)}`;
      }
    }

    const handler = new TestHandler();
    const result = await (handler.handle as unknown as (payload: unknown) => Promise<string>)(
      'sync-data',
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(validator.validate).toHaveBeenCalledWith('sync-data');
    expect(result).toBe('processed: sync-data');
  });
});
