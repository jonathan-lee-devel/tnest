import { MessagePattern } from '@nestjs/microservices';
import type { Observable } from 'rxjs';
import type {
  ContractRegistry,
  CommandPatterns,
  QueryPatterns,
  PayloadOf,
  ResponseOf,
} from '../contracts';

/* eslint-disable @typescript-eslint/no-explicit-any -- `any` required for conditional type matching and decorator cast */

type MessageMethodDecorator<
  TRegistry extends ContractRegistry,
  P extends string & keyof TRegistry,
> = (
  target: object,
  propertyKey: string | symbol,
  descriptor:
    | TypedPropertyDescriptor<(data: PayloadOf<TRegistry[P]>) => ResponseOf<TRegistry[P]>>
    | TypedPropertyDescriptor<(data: PayloadOf<TRegistry[P]>) => Promise<ResponseOf<TRegistry[P]>>>
    | TypedPropertyDescriptor<
        (data: PayloadOf<TRegistry[P]>) => Observable<ResponseOf<TRegistry[P]>>
      >,
) => void;

export function TypedMessagePattern<
  TRegistry extends ContractRegistry,
  P extends CommandPatterns<TRegistry> | QueryPatterns<TRegistry> = never,
>(
  pattern: [P] extends [never] ? CommandPatterns<TRegistry> | QueryPatterns<TRegistry> : P,
): [P] extends [never] ? MethodDecorator : MessageMethodDecorator<TRegistry, P> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return MessagePattern(pattern as string) as any;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
