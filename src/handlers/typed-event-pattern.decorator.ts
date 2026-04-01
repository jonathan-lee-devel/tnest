import { EventPattern } from '@nestjs/microservices';
import type { ContractRegistry, EventPatterns, PayloadOf } from '../contracts';

/* eslint-disable @typescript-eslint/no-explicit-any -- `any` required for conditional type matching and decorator cast */

type EventMethodDecorator<
  TRegistry extends ContractRegistry,
  P extends string & keyof TRegistry,
> = (
  target: object,
  propertyKey: string | symbol,
  descriptor:
    | TypedPropertyDescriptor<(data: PayloadOf<TRegistry[P]>) => void>
    | TypedPropertyDescriptor<(data: PayloadOf<TRegistry[P]>) => Promise<void>>,
) => void;

export function TypedEventPattern<
  TRegistry extends ContractRegistry,
  P extends EventPatterns<TRegistry> = never,
>(
  pattern: [P] extends [never] ? EventPatterns<TRegistry> : P,
): [P] extends [never] ? MethodDecorator : EventMethodDecorator<TRegistry, P> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return EventPattern(pattern as string) as any;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
