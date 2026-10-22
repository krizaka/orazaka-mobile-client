import type { Wallet } from "@krizaka/orazaka-shared";
import { spendableCredits } from "../credits";

const wallet = (granted: number, purchased: number, held: number) => ({ balanceGranted: granted, balancePurchased: purchased, held }) as Wallet;

describe("the credits balance shown on the phone", () => {
  it("is what is left once reservations are set aside", () => {
    expect(spendableCredits(wallet(500, 300, 100))).toBe(700);
  });

  it("is never negative: a dev account that overshot its grant reads 0, not -860", () => {
    expect(spendableCredits(wallet(0, 0, 860))).toBe(0);
    expect(spendableCredits(wallet(-860, 0, 0))).toBe(0);
  });
});
