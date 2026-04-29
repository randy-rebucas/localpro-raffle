export interface IUser {
  id: string;
  email: string;
  password?: string | null;
  name?: string | null;
  createdAt: Date;
}
