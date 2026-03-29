export interface ContractValidator {
  validate(payload: unknown): void | Promise<void>;
}

export const CONTRACT_VALIDATOR = Symbol('CONTRACT_VALIDATOR');
