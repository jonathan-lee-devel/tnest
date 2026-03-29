export interface Command<TPattern extends string = string, TPayload = unknown, TResponse = void> {
  readonly __type: 'command';
  readonly pattern: TPattern;
  readonly payload: TPayload;
  readonly response: TResponse;
}
