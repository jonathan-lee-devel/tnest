import { Inject } from '@nestjs/common';
import { CONTRACT_VALIDATOR, type ContractValidator } from './validator.interface';

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