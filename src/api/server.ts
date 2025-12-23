// Main server file with Express routes and Socket.io integration

import express from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import { v4 as uuidv4 } from "uuid";
import type { Request, Response } from "express";
import type { Socket } from "socket.io";

import type {
  CreateUserCommand,
  DepositFundsCommand,
  WithdrawFundsCommand,
  CloseAccountCommand,
  Command,
} from "../domain/commands";
import { COMMAND_TYPES } from "../domain/commands";
import { AccountAggregate } from "../domain/aggregate";
import { InMemoryEventStore } from "../infrastructure/eventStore";
import { AccountProjection } from "../projections/accountView";

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Initialize components
const eventStore = new InMemoryEventStore();
const accountProjection = new AccountProjection();

// Load existing events and rebuild projections on startup
(async () => {
  try {
    const allEvents = await eventStore.getAllEvents();
    accountProjection.rebuildFromEvents(allEvents);
    console.log(`Loaded ${allEvents.length} events and rebuilt projections`);
  } catch (error) {
    console.error("Error loading events on startup:", error);
  }
})();

// Command handler
async function handleCommand(command: Command): Promise<void> {
  const aggregate = new AccountAggregate(command.aggregateId);

  // Load current state from events
  const events = await eventStore.getEventsForAggregate(command.aggregateId);
  aggregate.loadFromHistory(events);

  // Handle command and get new events
  const newEvents = aggregate.handleCommand(command);

  // Save events
  const currentVersion = events.length;
  await eventStore.saveEvents(command.aggregateId, newEvents, currentVersion);

  // Update projections
  for (const event of newEvents) {
    accountProjection.processEvent(event);
  }

  // Emit events to connected clients
  io.emit("events", newEvents);

  console.log(
    `Processed command ${command.commandType} for aggregate ${command.aggregateId}`
  );
}

// API Routes

// Create user
app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    const aggregateId = uuidv4();

    const command: CreateUserCommand = {
      commandId: uuidv4(),
      aggregateId,
      commandType: COMMAND_TYPES.CREATE_USER,
      timestamp: new Date(),
      data: { name, email },
    };

    await handleCommand(command);

    const accountView = accountProjection.getAccountView(aggregateId);
    res.status(201).json({ accountId: aggregateId, account: accountView });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Deposit funds
app.post(
  "/api/accounts/:accountId/deposit",
  async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      const { amount, currency = "USD" } = req.body;
      if (accountId) {
        const command: DepositFundsCommand = {
          commandId: uuidv4(),
          aggregateId: accountId,
          commandType: COMMAND_TYPES.DEPOSIT_FUNDS,
          timestamp: new Date(),
          data: { amount: Number(amount), currency },
        };

        await handleCommand(command);

        const accountView = accountProjection.getAccountView(accountId);
        res.json({ account: accountView });
      } else {
        throw new Error("Account ID is required");
      }
    } catch (error) {
      console.error("Error depositing funds:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// Withdraw funds
app.post(
  "/api/accounts/:accountId/withdraw",
  async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      const { amount, currency = "USD" } = req.body;
      if (accountId) {
        const command: WithdrawFundsCommand = {
          commandId: uuidv4(),
          aggregateId: accountId,
          commandType: COMMAND_TYPES.WITHDRAW_FUNDS,
          timestamp: new Date(),
          data: { amount: Number(amount), currency },
        };

        await handleCommand(command);

        const accountView = accountProjection.getAccountView(accountId);
        res.json({ account: accountView });
      } else {
        throw new Error("Account ID is required");
      }
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// Close account
app.post(
  "/api/accounts/:accountId/close",
  async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      const { reason = "User requested" } = req.body;
      if (accountId) {
        const command: CloseAccountCommand = {
          commandId: uuidv4(),
          aggregateId: accountId,
          commandType: COMMAND_TYPES.CLOSE_ACCOUNT,
          timestamp: new Date(),
          data: { reason },
        };

        await handleCommand(command);

        const accountView = accountProjection.getAccountView(accountId);
        res.json({ account: accountView });
      } else {
        throw new Error("Account ID is required");
      }
    } catch (error) {
      console.error("Error closing account:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// Get account
app.get("/api/accounts/:accountId", (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const accountView =
      accountId && accountProjection.getAccountView(accountId);

    if (!accountView) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({ account: accountView });
  } catch (error) {
    console.error("Error getting account:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get all accounts
app.get("/api/accounts", (req: Request, res: Response) => {
  try {
    const accounts = accountProjection.getAllAccountViews();
    res.json({ accounts });
  } catch (error) {
    console.error("Error getting accounts:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get events for account
app.get(
  "/api/accounts/:accountId/events",
  async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      if (accountId) {
        const events = await eventStore.getEventsForAggregate(accountId);
        res.json({ events });
      } else {
        throw new Error("Account ID is required");
      }
    } catch (error) {
      console.error("Error getting events:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Socket.io connection handling
io.on("connection", (socket: Socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Event Sourcing server running on port ${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});
