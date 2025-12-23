// Projection for Account View
// Reduces events into a read model suitable for UI consumption

import type {
  Event,
  UserCreatedEvent,
  FundsDepositedEvent,
  FundsWithdrawnEvent,
  AccountClosedEvent,
} from "../domain/events";
import { EVENT_TYPES } from "../domain/events";

export interface AccountView {
  aggregateId: string;
  userId?: string;
  name?: string;
  email?: string;
  balance: number;
  currency: string;
  isClosed: boolean;
  lastActivity: Date;
}

export class AccountProjection {
  private views: Map<string, AccountView> = new Map();

  // Process events to build/update projections
  processEvent(event: Event): void {
    const aggregateId = event.aggregateId;
    let view = this.views.get(aggregateId);

    if (!view) {
      view = {
        aggregateId,
        balance: 0,
        currency: "USD",
        isClosed: false,
        lastActivity: event.timestamp,
      };
      this.views.set(aggregateId, view);
    }

    // Update view based on event type
    switch (event.eventType) {
      case EVENT_TYPES.USER_CREATED:
        const userCreated = event as UserCreatedEvent;
        view.userId = userCreated.data.userId;
        view.name = userCreated.data.name;
        view.email = userCreated.data.email;
        break;

      case EVENT_TYPES.FUNDS_DEPOSITED:
        const fundsDeposited = event as FundsDepositedEvent;
        view.balance += fundsDeposited.data.amount;
        view.currency = fundsDeposited.data.currency;
        break;

      case EVENT_TYPES.FUNDS_WITHDRAWN:
        const fundsWithdrawn = event as FundsWithdrawnEvent;
        view.balance -= fundsWithdrawn.data.amount;
        break;

      case EVENT_TYPES.ACCOUNT_CLOSED:
        view.isClosed = true;
        break;
    }

    view.lastActivity = event.timestamp;
  }

  // Get account view by aggregate ID
  getAccountView(aggregateId: string): AccountView | undefined {
    return this.views.get(aggregateId);
  }

  // Get all account views
  getAllAccountViews(): AccountView[] {
    return Array.from(this.views.values());
  }

  // Rebuild projections from all events (useful for startup or rebuilding)
  rebuildFromEvents(events: Event[]): void {
    this.views.clear();
    for (const event of events) {
      this.processEvent(event);
    }
  }
}
