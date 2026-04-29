export interface ITier {
  id: string;
  raffleId: string;
  prizeName: string;
  prizeAmount: number;
  winnerCount: number;
  tierOrder: number;
  createdAt: Date;
}
