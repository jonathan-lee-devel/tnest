import { type ClientProxy } from '@nestjs/microservices';
import type { Observable } from 'rxjs';
import type {
  ContractRegistry,
  EventPatterns,
  PayloadOf,
  ResponseOf,
  SendablePatterns,
} from '../contracts';

export class TypedClient<TRegistry extends ContractRegistry> {
  constructor(private readonly client: ClientProxy) {}

  send<P extends SendablePatterns<TRegistry>>(
    pattern: P,
    payload: PayloadOf<TRegistry[P]>,
  ): Observable<ResponseOf<TRegistry[P]>> {
    return this.client.send<ResponseOf<TRegistry[P]>>(pattern, payload);
  }

  emit<P extends EventPatterns<TRegistry>>(
    pattern: P,
    payload: PayloadOf<TRegistry[P]>,
  ): Observable<undefined> {
    return this.client.emit(pattern, payload);
  }

  connect(): Promise<void> {
    return this.client.connect();
  }

  close(): void {
    this.client.close();
  }
}