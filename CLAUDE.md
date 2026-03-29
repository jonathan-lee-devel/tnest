# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**tnest** (`@jdevel/tnest`) is a NestJS library for **type-safe communication between microservices** in a distributed NestJS architecture. It is published as an npm package that ships CommonJS with TypeScript declarations.

The core goal is to let teams define shared message contracts (commands, events, queries) as TypeScript types and have the library enforce those contracts at compile time across service boundaries — eliminating runtime type mismatches between producers and consumers.

### Key Concepts

- **Contracts** — shared TypeScript interfaces/types that define the shape of messages exchanged between microservices (payloads, responses, topics/patterns).
- **Type-safe messaging** — producers and consumers reference the same contract types, so the compiler catches mismatches before deployment.
- **Transport-agnostic** — the library should work with any NestJS microservice transport (TCP, Redis, NATS, RabbitMQ, Kafka, gRPC, etc.) by operating at the NestJS abstraction layer (`ClientProxy`, `@MessagePattern`, `@EventPattern`).
- **NestJS-native** — uses standard NestJS patterns: modules, injectable services, decorators, and the built-in microservices package.

## Commands

```bash
npm run build          # runs tsc
npm run test           # runs jest
npm run test:watch     # runs jest in watch mode
npm run test:cov       # runs jest with coverage
npm run lint           # runs eslint on src/
npm run lint:fix       # runs eslint with --fix
npm run format         # runs prettier --write
npm run format:check   # runs prettier --check
```

## Architecture

- **src/index.ts** — barrel export (public API surface). All public types, decorators, modules, and services must be re-exported here.
- **src/contracts/** — contract type primitives (`Command`, `Event`, `Query`), utility types, registry, and builder helpers.
- **src/client/** — `TypedClient` (wraps `ClientProxy` with type safety) and `TypedClientFactory` (injectable factory).
- **src/handlers/** — `TypedMessagePattern` and `TypedEventPattern` decorators, handler type helpers.
- **src/interfaces/** — module configuration types (`TnestModuleOptions`, `TnestModuleAsyncOptions`).
- **src/validation/** — optional runtime validation decorator (`@ValidateContract`).
- **src/serialization/** — pluggable serialization interfaces and default pass-through implementation.
- **src/testing/** — `MockTypedClient` and `TestContractModule` for unit testing consumers.
- **src/tnest.module.ts** — NestJS dynamic module with `forRoot()` / `forRootAsync()`.
- **src/constants.ts** — injection tokens (`TNEST_OPTIONS`, `getClientToken()`).
- **dist/** — compiled output (CommonJS + declarations).

### Test file convention

Tests live in `__tests__/` directories alongside the code they test, named `*.spec.ts`.

Peer dependencies: `@nestjs/common` (v10–11), `@nestjs/microservices` (v10–11), `reflect-metadata`, `rxjs` v7.

## Design Principles

- **Type safety first** — prefer compile-time guarantees over runtime validation. Use generics and conditional types to propagate contract types through the API.
- **Zero runtime overhead when possible** — type enforcement should happen at compile time; avoid unnecessary runtime type-checking unless the user opts in.
- **Minimal API surface** — expose only what consumers need. Keep internals private.
- **Decorator-driven** — follow NestJS conventions. Use decorators for handler registration and metadata.
- **No opinions on transport** — do not couple to a specific message broker. Rely on `@nestjs/microservices` abstractions.
