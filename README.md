# event-sourcing

An Event Sourcing system in Node.js to learn about distributed systems, auditability, and state management. Unlike traditional CRUD where you only store the current state, in Event Sourcing, you store the history of changes as a sequence of immutable events.

# The Technology Stack (2025 Recommended)

For a modern, "mini" version that effectively demonstrates the pattern without unnecessary overhead:

Runtime: Node.js (LTS version).

Language: TypeScript. This is highly recommended because event schemas are the "contract" of your system; type safety prevents bugs when replaying events.

Backend Framework: Express. Keep it minimal so the pattern remains visible.

Event Store (Database): PostgreSQL with a single events table. It’s excellent for this because of JSONB support and ACID guarantees.

Frontend: Vite + Vanilla JS. This keeps the focus on the data flow rather than framework-specific state management.

Real-time Updates: Socket.io. This will allow the frontend to "see" events being appended to the log in real-time.

# Project Structure

es-demo/
├── src/

│ ├── domain/ # Business Logic

│ │ ├── events.ts # Definitions (e.g., USER_CREATED, FUNDS_DEPOSITED)

│ │ ├── commands.ts # Intent to change state (e.g., CREATE_USER)

│ │ └── aggregate.ts # The "Decider" (Logic to validate & produce events)

│ ├── infrastructure/ # Database & Tools

│ │ └── eventStore.ts # Logic to save/retrieve from the DB

│ ├── projections/ # Read Models

│ │ └── accountView.ts # Logic to "reduce" events into a UI-ready state

│ └── api/ # Entry points

│ └── server.ts # Express/Fastify routes

├── public/ # Mini Frontend (HTML/CSS/JS)

├── tsconfig.json

└── package.json


