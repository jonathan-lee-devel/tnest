import { Injectable } from '@nestjs/common';
import type { PayloadSerializer, PayloadDeserializer } from './serializer.interface';

@Injectable()
export class DefaultPayloadSerializer implements PayloadSerializer, PayloadDeserializer {
  serialize(payload: unknown): unknown {
    return payload;
  }

  deserialize(data: unknown): unknown {
    return data;
  }
}