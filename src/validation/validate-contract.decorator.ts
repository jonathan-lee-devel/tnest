import { Inject } from '@nestjs/common';
import { CONTRACT_VALIDATOR, type ContractValidator } from './validator.interface';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call -- decorator internals require dynamic property access */

export function ValidateContract(): MethodDecorator {
  const injectValidator = Inject(CONTRACT_VALIDATOR);

  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    injectValidator(target, '__contractValidator');

    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, payload: unknown, ...args: unknown[]) {
      const validator: ContractValidator | undefined = this.__contractValidator;
      if (validator) {
        await validator.validate(payload);
      }
      return originalMethod.call(this, payload, ...args);
    };

    return descriptor;
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
