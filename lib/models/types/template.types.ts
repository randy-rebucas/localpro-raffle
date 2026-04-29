export interface ITemplate {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  tiers: string;
  createdAt: Date;
  updatedAt: Date;
}
