export interface Event<
  TPattern extends string = string,
  TPayload = unknown,
> {
  readonly __type: 'event';
  readonly pattern: TPattern;
  readonly payload: TPayload;
}