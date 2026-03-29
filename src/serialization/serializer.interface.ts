export interface PayloadSerializer {
  serialize(payload: unknown): unknown;
}

export interface PayloadDeserializer {
  deserialize(data: unknown): unknown;
}

export const PAYLOAD_SERIALIZER = Symbol('PAYLOAD_SERIALIZER');
export const PAYLOAD_DESERIALIZER = Symbol('PAYLOAD_DESERIALIZER');