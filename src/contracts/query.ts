export interface Query<
  TPattern extends string = string,
  TPayload = unknown,
  TResponse = unknown,
> {
  readonly __type: 'query';
  readonly pattern: TPattern;
  readonly payload: TPayload;
  readonly response: TResponse;
}