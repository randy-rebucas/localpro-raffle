import { Schema } from 'mongoose';
import { COLLECTIONS } from './collections';
import { registerModel } from './register-model';
import type { IUser } from './types';

const userSchema = new Schema<IUser>(
  {
    id: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, default: null },
    name: { type: String, default: null },
    createdAt: { type: Date, required: true },
  },
  { collection: COLLECTIONS.users, versionKey: false }
);

userSchema.index({ id: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

export const User = registerModel<IUser>('User', userSchema);
