# event-sourcing

An Event Sourcing system in Node.js to learn about distributed systems, auditability, and state management. Unlike traditional CRUD where you only store the current state, in Event Sourcing, you store the history of changes as a sequence of immutable events.

Snapshots:
<img width="1433" height="870" alt="image" src="https://github.com/user-attachments/assets/d825990c-01a9-40fc-aaa0-17e1589e21a8" />
<img width="1438" height="855" alt="image" src="https://github.com/user-attachments/assets/1f2cb568-5f15-4079-890c-b3b1460c8725" />

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

| src/

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

## Prerequisites

- Node.js (LTS version recommended)
- npm (comes with Node.js)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/HadiAbu/event-sourcing
cd event-sourcing
```

2. Install dependencies:

```bash
npm install
```

## Running the Project

### Development Mode

Run the server in development mode with hot reloading:

```bash
npm run dev
```

This will start the server on `http://localhost:3000` with TypeScript compilation and automatic restarts on file changes.

### Production Mode

1. Build the project:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

## API Usage

Once the server is running, you can interact with the Event Sourcing API:

### Create a User Account

```bash
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Deposit Funds

```bash
POST http://localhost:3000/api/accounts/{accountId}/deposit
Content-Type: application/json

{
  "amount": 100,
  "currency": "USD"
}
```

### Withdraw Funds

```bash
POST http://localhost:3000/api/accounts/{accountId}/withdraw
Content-Type: application/json

{
  "amount": 50,
  "currency": "USD"
}
```

### Close Account

```bash
POST http://localhost:3000/api/accounts/{accountId}/close
Content-Type: application/json

{
  "reason": "User requested"
}
```

### Get Account Details

```bash
GET http://localhost:3000/api/accounts/{accountId}
```

### Get All Accounts

```bash
GET http://localhost:3000/api/accounts
```

### Get Account Events

```bash
GET http://localhost:3000/api/accounts/{accountId}/events
```
