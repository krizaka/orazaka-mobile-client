import { availableCredits, type Wallet } from "@krizaka/orazaka-shared";

/**
 * The balance a person may spend, as shown on a screen.
 *
 * The ledger may legitimately go below zero (a bounded settlement overshoot, or shadow metering on dev), but a negative
 * balance is a ledger fact, not something to tell a customer: it reads as "you owe credits". The screen shows 0.
 */
export function spendableCredits(wallet: Wallet): number {
  return Math.max(0, availableCredits(wallet));
}
