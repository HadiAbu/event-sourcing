// Aggregate logic for the Event Sourcing system
// The aggregate is responsible for validating commands and producing events

import type {
  Command,
  CreateUserCommand,
  DepositFundsCommand,
  WithdrawFundsCommand,
  CloseAccountCommand,
} from "./commands";
import { COMMAND_TYPES } from "./commands";
import type {
  Event,
  UserCreatedEvent,
  FundsDepositedEvent,
  FundsWithdrawnEvent,
  AccountClosedEvent,
} from "./events";
import { EVENT_TYPES } from "./events";
import { v4 as uuidv4 } from "uuid";

export interface AccountState {
  aggregateId: string;
  version: number;
  userId?: string;
  name?: string;
  email?: string;
  balance: number;
  currency: string;
  isClosed: boolean;
}

export class AccountAggregate {
  private state: AccountState;

  constructor(aggregateId: string) {
    this.state = {
      aggregateId,
      version: 0,
      balance: 0,
      currency: "USD",
      isClosed: false,
    };
  }

  // Load state from events
  loadFromHistory(events: Event[]): void {
    for (const event of events) {
      this.applyEvent(event);
    }
  }

  // Handle commands and produce events
  handleCommand(command: Command): Event[] {
    switch (command.commandType) {
      case COMMAND_TYPES.CREATE_USER:
        return this.handleCreateUser(command as CreateUserCommand);
      case COMMAND_TYPES.DEPOSIT_FUNDS:
        return this.handleDepositFunds(command as DepositFundsCommand);
      case COMMAND_TYPES.WITHDRAW_FUNDS:
        return this.handleWithdrawFunds(command as WithdrawFundsCommand);
      case COMMAND_TYPES.CLOSE_ACCOUNT:
        return this.handleCloseAccount(command as CloseAccountCommand);
      default:
        throw new Error(`Unknown command type`);
    }
  }

  private handleCreateUser(command: CreateUserCommand): Event[] {
    if (this.state.userId) {
      throw new Error("User already exists");
    }

    const event: UserCreatedEvent = {
      eventId: uuidv4(),
      aggregateId: command.aggregateId,
      eventType: EVENT_TYPES.USER_CREATED,
      timestamp: new Date(),
      version: this.state.version + 1,
      data: {
        userId: command.aggregateId,
        name: command.data.name,
        email: command.data.email,
      },
    };

    return [event];
  }

  private handleDepositFunds(command: DepositFundsCommand): Event[] {
    if (this.state.isClosed) {
      throw new Error("Cannot deposit to closed account");
    }

    if (command.data.amount <= 0) {
      throw new Error("Deposit amount must be positive");
    }

    const event: FundsDepositedEvent = {
      eventId: uuidv4(),
      aggregateId: command.aggregateId,
      eventType: EVENT_TYPES.FUNDS_DEPOSITED,
      timestamp: new Date(),
      version: this.state.version + 1,
      data: {
        amount: command.data.amount,
        currency: command.data.currency,
      },
    };

    return [event];
  }

  private handleWithdrawFunds(command: WithdrawFundsCommand): Event[] {
    if (this.state.isClosed) {
      throw new Error("Cannot withdraw from closed account");
    }

    if (command.data.amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
    }

    if (this.state.balance < command.data.amount) {
      throw new Error("Insufficient funds");
    }

    const event: FundsWithdrawnEvent = {
      eventId: uuidv4(),
      aggregateId: command.aggregateId,
      eventType: EVENT_TYPES.FUNDS_WITHDRAWN,
      timestamp: new Date(),
      version: this.state.version + 1,
      data: {
        amount: command.data.amount,
        currency: command.data.currency,
      },
    };

    return [event];
  }

  private handleCloseAccount(command: CloseAccountCommand): Event[] {
    if (this.state.isClosed) {
      throw new Error("Account already closed");
    }

    const event: AccountClosedEvent = {
      eventId: uuidv4(),
      aggregateId: command.aggregateId,
      eventType: EVENT_TYPES.ACCOUNT_CLOSED,
      timestamp: new Date(),
      version: this.state.version + 1,
      data: {
        reason: command.data.reason,
      },
    };

    return [event];
  }

  // Apply event to update state
  private applyEvent(event: Event): void {
    this.state.version = event.version;

    switch (event.eventType) {
      case EVENT_TYPES.USER_CREATED:
        const userCreated = event as UserCreatedEvent;
        this.state.userId = userCreated.data.userId;
        this.state.name = userCreated.data.name;
        this.state.email = userCreated.data.email;
        break;

      case EVENT_TYPES.FUNDS_DEPOSITED:
        const fundsDeposited = event as FundsDepositedEvent;
        this.state.balance += fundsDeposited.data.amount;
        break;

      case EVENT_TYPES.FUNDS_WITHDRAWN:
        const fundsWithdrawn = event as FundsWithdrawnEvent;
        this.state.balance -= fundsWithdrawn.data.amount;
        break;

      case EVENT_TYPES.ACCOUNT_CLOSED:
        this.state.isClosed = true;
        break;
    }
  }

  getState(): AccountState {
    return { ...this.state };
  }
}
