# Long-Distance Delivery Handoff Backend

## Overview

This service implements a minimal backend for managing **long-distance delivery handoffs**, where an order may be handled by **multiple riders sequentially**.

The system focuses on **correctness, consistency, and concurrency safety**, ensuring that:
- Only **one rider** can work on an order at a time
- Riders can hand off work **safely and sequentially**
- Duplicate, concurrent, and out-of-order requests do not corrupt state

---

## Requirements Covered

- Create an order
- Rider starts work on an order
- Rider finishes work on an order
- Sequential rider handoff
- Correct behavior under concurrent requests
- Tolerant to duplicate and out-of-order requests
- No UI, authentication, routing, or distance logic
- Implemented with **NestJS**

---

## Tech Stack

- **NestJS (TypeScript)**
- **PostgreSQL**
- **TypeORM**
- **Docker / Docker Compose**
- **Jest + Supertest** (integration tests)

---

## Design Summary

### Core Rules
- An order can have **at most one active rider**
- Riders work on the same order **one after another**
- Every rider assignment is recorded for auditability
- The database is the **single source of truth**

---

## Data Model

### `orders`
Tracks the **current state** of an order.
- `current_rider_id` indicates the active rider (nullable)
- `version` tracks state changes for concurrency control

### `order_assignments`
Tracks the **history of rider handoffs**.
- One row per rider’s work window
- Ensures sequential, non-overlapping assignments

---

## API Endpoints

### Create Order
POST /orders

### Start Work
POST /orders/:id/start

```json
{ "riderId": "uuid" }
```

Finish Work
POST /orders/:id/finish

```json
{ "riderId": "uuid" }
```
---

### Concurrency & Consistency

The system is safe under concurrency using:

Database transactions

Row-level locking

Explicit state validation

Idempotent request handling

| Scenario                  | Result               |
| ------------------------- | -------------------- |
| Concurrent starts         | Exactly one succeeds |
| Same rider retries        | Idempotent success   |
| Different rider conflicts | Rejected             |
| Finish called twice       | Safe no-op           |
| Sequential riders         | Allowed              |


### Testing Strategy

Concurrency and handoff behavior are validated using integration tests with:

A real NestJS application instance

A real PostgreSQL database

Concurrent HTTP requests

Run Tests
  `npm run test`


Tests verify:

Concurrent start correctness

Sequential rider handoff

Idempotent finish behavior

## Running the Project

1. Environment Variables

Create .env:

DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=delivery

2. Start PostgreSQL
docker-compose up -d

3. Install Dependencies
npm install

4. Start the App
npm run start:dev


Server runs on:

http://localhost:3000


## Project Structure

```text
src/
 └── orders/
     ├── entities/
     ├── orders.controller.ts
     ├── orders.service.ts
     └── orders.module.ts

test/
 └── orders/
     └── orders.concurrency.spec.ts


### Assumptions

One rider works on an order at a time

Riders are trusted identifiers (no authentication)

Database enforces correctness

Focus is correctness over optimization


### Summary

This implementation demonstrates:

Correct sequential handoff modeling

Safe concurrent behavior

Idempotent, resilient APIs

Real-world backend engineering practices