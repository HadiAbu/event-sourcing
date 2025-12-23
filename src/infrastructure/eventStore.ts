// Event Store implementation
// Responsible for persisting and retrieving events from storage

import type { Event } from "../domain/events";

export interface EventStore {
  saveEvents(
    aggregateId: string,
    events: Event[],
    expectedVersion: number
  ): Promise<void>;
  getEventsForAggregate(aggregateId: string): Promise<Event[]>;
  getAllEvents(): Promise<Event[]>;
}

// In-memory implementation for demonstration
// In production, this would be replaced with PostgreSQL implementation
export class InMemoryEventStore implements EventStore {
  private events: Event[] = [];

  async saveEvents(
    aggregateId: string,
    events: Event[],
    expectedVersion: number
  ): Promise<void> {
    // Check for concurrency issues
    const existingEvents = this.events.filter(
      (e) => e.aggregateId === aggregateId
    );
    const currentVersion =
      existingEvents.length > 0
        ? Math.max(...existingEvents.map((e) => e.version))
        : 0;

    if (currentVersion !== expectedVersion) {
      throw new Error(
        `Concurrency error: expected version ${expectedVersion}, but current version is ${currentVersion}`
      );
    }

    // Validate event versions
    for (const event of events) {
      if (event.aggregateId !== aggregateId) {
        throw new Error("Event aggregateId does not match");
      }
      if (event.version !== currentVersion + 1) {
        throw new Error("Event version is not sequential");
      }
    }

    // Save events
    this.events.push(...events);
  }

  async getEventsForAggregate(aggregateId: string): Promise<Event[]> {
    return this.events
      .filter((event) => event.aggregateId === aggregateId)
      .sort((a, b) => a.version - b.version);
  }

  async getAllEvents(): Promise<Event[]> {
    return [...this.events].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }
}

// PostgreSQL implementation (commented out - would require pg package)
// export class PostgreSQLEventStore implements EventStore {
//   constructor(private pool: Pool) {}
//
//   async saveEvents(aggregateId: string, events: Event[], expectedVersion: number): Promise<void> {
//     const client = await this.pool.connect();
//     try {
//       await client.query('BEGIN');
//
//       // Check current version
//       const result = await client.query(
//         'SELECT MAX(version) as version FROM events WHERE aggregate_id = $1',
//         [aggregateId]
//       );
//       const currentVersion = result.rows[0].version || 0;
//
//       if (currentVersion !== expectedVersion) {
//         throw new Error(`Concurrency error: expected version ${expectedVersion}, but current version is ${currentVersion}`);
//       }
//
//       // Insert events
//       for (const event of events) {
//         await client.query(
//           'INSERT INTO events (event_id, aggregate_id, event_type, timestamp, version, data) VALUES ($1, $2, $3, $4, $5, $6)',
//           [event.eventId, event.aggregateId, event.eventType, event.timestamp, event.version, JSON.stringify(event.data)]
//         );
//       }
//
//       await client.query('COMMIT');
//     } catch (error) {
//       await client.query('ROLLBACK');
//       throw error;
//     } finally {
//       client.release();
//     }
//   }
//
//   async getEventsForAggregate(aggregateId: string): Promise<Event[]> {
//     const result = await this.pool.query(
//       'SELECT * FROM events WHERE aggregate_id = $1 ORDER BY version',
//       [aggregateId]
//     );
//     return result.rows.map(row => ({
//       ...row,
//       timestamp: new Date(row.timestamp),
//       data: JSON.parse(row.data)
//     }));
//   }
//
//   async getAllEvents(): Promise<Event[]> {
//     const result = await this.pool.query('SELECT * FROM events ORDER BY timestamp');
//     return result.rows.map(row => ({
//       ...row,
//       timestamp: new Date(row.timestamp),
//       data: JSON.parse(row.data)
//     }));
//   }
// }
