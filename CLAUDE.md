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

### Current State

The codebase is a **scaffold** — the module and service contain placeholder logic only. All production functionality described above is yet to be implemented.

## Build

```bash
npm run build    # runs tsc
```

There is no test runner, linter, or formatter configured yet.

## Architecture

- **src/index.ts** — barrel export (public API surface). All public types, decorators, modules, and services must be re-exported here.
- **src/tnest.module.ts** — NestJS dynamic module that provides and exports library services. Will likely need `forRoot` / `forRootAsync` static methods for configuration (transport options, serialization, etc.).
- **src/tnest.service.ts** — injectable service containing library logic.
- **dist/** — compiled output (CommonJS + declarations).

Peer dependencies: `@nestjs/common` (v10–11), `reflect-metadata`, `rxjs` v7.

## Design Principles

- **Type safety first** — prefer compile-time guarantees over runtime validation. Use generics and conditional types to propagate contract types through the API.
- **Zero runtime overhead when possible** — type enforcement should happen at compile time; avoid unnecessary runtime type-checking unless the user opts in.
- **Minimal API surface** — expose only what consumers need. Keep internals private.
- **Decorator-driven** — follow NestJS conventions. Use decorators for handler registration and metadata.
- **No opinions on transport** — do not couple to a specific message broker. Rely on `@nestjs/microservices` abstractions.
