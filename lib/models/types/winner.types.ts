export interface IWinner {
  id: string;
  raffleId: string;
  tierId: string;
  participantId: string;
  drawnAt: Date;
  emailSent: boolean;
}
