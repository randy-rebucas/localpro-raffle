export interface IRaffle {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: Date;
  drawnAt?: Date | null;
  createdBy: string;
}
