import { MessagePattern } from '@nestjs/microservices';
import type {
  ContractRegistry,
  CommandPatterns,
  QueryPatterns,
} from '../contracts';

export function TypedMessagePattern<
  TRegistry extends ContractRegistry,
>(pattern: CommandPatterns<TRegistry> | QueryPatterns<TRegistry>): MethodDecorator {
  return MessagePattern(pattern);
}