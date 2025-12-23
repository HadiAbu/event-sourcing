// Command definitions for the Event Sourcing system
// Commands represent the intent to change the state of the system

export interface BaseCommand {
  commandId: string;
  aggregateId: string;
  commandType: string;
  timestamp: Date;
}

export const COMMAND_TYPES = {
  CREATE_USER: "CREATE_USER",
  DEPOSIT_FUNDS: "DEPOSIT_FUNDS",
  WITHDRAW_FUNDS: "WITHDRAW_FUNDS",
  CLOSE_ACCOUNT: "CLOSE_ACCOUNT",
} as const;

export type CommandType = (typeof COMMAND_TYPES)[keyof typeof COMMAND_TYPES];

// Specific command interfaces
export interface CreateUserCommand extends BaseCommand {
  commandType: typeof COMMAND_TYPES.CREATE_USER;
  aggregateId: string;
  data: {
    name: string;
    email: string;
  };
}

export interface DepositFundsCommand extends BaseCommand {
  commandType: typeof COMMAND_TYPES.DEPOSIT_FUNDS;
  aggregateId: string;
  data: {
    amount: number;
    currency: string;
  };
}

export interface WithdrawFundsCommand extends BaseCommand {
  commandType: typeof COMMAND_TYPES.WITHDRAW_FUNDS;
  aggregateId: string;
  data: {
    amount: number;
    currency: string;
  };
}

export interface CloseAccountCommand extends BaseCommand {
  commandType: typeof COMMAND_TYPES.CLOSE_ACCOUNT;
  aggregateId: string;
  data: {
    reason: string;
  };
}

export type Command =
  | CreateUserCommand
  | DepositFundsCommand
  | WithdrawFundsCommand
  | CloseAccountCommand;
