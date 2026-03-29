import { of, type Observable } from 'rxjs';
import type {
  ContractRegistry,
  EventPatterns,
  PayloadOf,
  ResponseOf,
  SendablePatterns,
} from '../contracts';
import type { TypedClient } from '../client';

interface RecordedMessage {
  type: 'send' | 'emit';
  pattern: string;
  payload: unknown;
}

export class MockTypedClient<TRegistry extends ContractRegistry>
  implements Pick<TypedClient<TRegistry>, 'send' | 'emit' | 'connect' | 'close'>
{
  private readonly _messages: RecordedMessage[] = [];
  private readonly _responses = new Map<string, unknown>();

  get messages(): readonly RecordedMessage[] {
    return this._messages;
  }

  setResponse<P extends SendablePatterns<TRegistry>>(
    pattern: P,
    response: ResponseOf<TRegistry[P]>,
  ): void {
    this._responses.set(pattern, response);
  }

  send<P extends SendablePatterns<TRegistry>>(
    pattern: P,
    payload: PayloadOf<TRegistry[P]>,
  ): Observable<ResponseOf<TRegistry[P]>> {
    this._messages.push({ type: 'send', pattern, payload });
    const response = this._responses.get(pattern) as ResponseOf<TRegistry[P]>;
    return of(response);
  }

  emit<P extends EventPatterns<TRegistry>>(
    pattern: P,
    payload: PayloadOf<TRegistry[P]>,
  ): Observable<undefined> {
    this._messages.push({ type: 'emit', pattern, payload });
    return of(undefined);
  }

  connect(): Promise<void> {
    return Promise.resolve();
  }

  close(): void {
    // no-op
  }

  reset(): void {
    this._messages.length = 0;
    this._responses.clear();
  }
}