// Event definitions for the Event Sourcing system
// Events represent immutable facts that have occurred in the system

export interface BaseEvent {
  eventId: string;
  aggregateId: string;
  eventType: string;
  timestamp: Date;
  version: number;
  data: any;
}

export const EVENT_TYPES = {
  USER_CREATED: "USER_CREATED",
  FUNDS_DEPOSITED: "FUNDS_DEPOSITED",
  FUNDS_WITHDRAWN: "FUNDS_WITHDRAWN",
  ACCOUNT_CLOSED: "ACCOUNT_CLOSED",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

// Specific event interfaces
export interface UserCreatedEvent extends BaseEvent {
  eventType: typeof EVENT_TYPES.USER_CREATED;
  data: {
    userId: string;
    name: string;
    email: string;
  };
}

export interface FundsDepositedEvent extends BaseEvent {
  eventType: typeof EVENT_TYPES.FUNDS_DEPOSITED;
  data: {
    amount: number;
    currency: string;
  };
}

export interface FundsWithdrawnEvent extends BaseEvent {
  eventType: typeof EVENT_TYPES.FUNDS_WITHDRAWN;
  data: {
    amount: number;
    currency: string;
  };
}

export interface AccountClosedEvent extends BaseEvent {
  eventType: typeof EVENT_TYPES.ACCOUNT_CLOSED;
  data: {
    reason: string;
  };
}

export type Event =
  | UserCreatedEvent
  | FundsDepositedEvent
  | FundsWithdrawnEvent
  | AccountClosedEvent;
