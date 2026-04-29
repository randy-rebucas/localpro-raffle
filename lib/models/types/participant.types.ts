export interface IParticipant {
  id: string;
  raffleId: string;
  name: string;
  email?: string | null;
  emailKey: string;
  addedAt: Date;
}
