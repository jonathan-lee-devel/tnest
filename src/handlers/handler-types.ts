import type { Observable } from 'rxjs';
import type {
  ContractRegistry,
  CommandPatterns,
  EventPatterns,
  QueryPatterns,
  PayloadOf,
  ResponseOf,
} from '../contracts';

export type TypedMessageHandler<
  TRegistry extends ContractRegistry,
  P extends CommandPatterns<TRegistry> | QueryPatterns<TRegistry>,
> = (
  payload: PayloadOf<TRegistry[P]>,
) =>
  | ResponseOf<TRegistry[P]>
  | Promise<ResponseOf<TRegistry[P]>>
  | Observable<ResponseOf<TRegistry[P]>>;

export type TypedEventHandler<
  TRegistry extends ContractRegistry,
  P extends EventPatterns<TRegistry>,
> = (payload: PayloadOf<TRegistry[P]>) => void | Promise<void>;
