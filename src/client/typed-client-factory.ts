import { Injectable } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, type ClientOptions } from '@nestjs/microservices';
import type { ContractRegistry } from '../contracts';
import { TypedClient } from './typed-client';

@Injectable()
export class TypedClientFactory {
  create<TRegistry extends ContractRegistry>(
    clientOrOptions: ClientProxy | ClientOptions,
  ): TypedClient<TRegistry> {
    const client =
      clientOrOptions instanceof ClientProxy
        ? clientOrOptions
        : ClientProxyFactory.create(clientOrOptions);

    return new TypedClient<TRegistry>(client);
  }
}
