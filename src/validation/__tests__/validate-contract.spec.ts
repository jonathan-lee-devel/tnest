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
      async handle(payload: unknown): Promise<string> {
        return `processed: ${String(payload)}`;
      }
    }

    const handler = new TestHandler();
    const result = await handler.handle('test-data');

    expect(validator.validate).toHaveBeenCalledWith('test-data');
    expect(result).toBe('processed: test-data');
  });

  it('runs handler without validation when no validator is set', async () => {
    class TestHandler {
      __contractValidator: ContractValidator | undefined = undefined;

      @ValidateContract()
      async handle(payload: unknown): Promise<string> {
        return `processed: ${String(payload)}`;
      }
    }

    const handler = new TestHandler();
    const result = await handler.handle('test-data');

    expect(result).toBe('processed: test-data');
  });

  it('propagates validation errors', async () => {
    const validator: ContractValidator = {
      validate: jest.fn().mockRejectedValue(new Error('Validation failed')),
    };

    class TestHandler {
      __contractValidator = validator;

      @ValidateContract()
      async handle(payload: unknown): Promise<string> {
        return `processed: ${String(payload)}`;
      }
    }

    const handler = new TestHandler();
    await expect(handler.handle('bad-data')).rejects.toThrow('Validation failed');
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
    const result = await handler.handle('sync-data');

    expect(validator.validate).toHaveBeenCalledWith('sync-data');
    expect(result).toBe('processed: sync-data');
  });
});
