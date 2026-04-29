import { Schema } from 'mongoose';
import { COLLECTIONS } from './collections';
import { registerModel } from './register-model';
import type { IRaffleShare } from './types';

const raffleShareSchema = new Schema<IRaffleShare>(
  {
    id: { type: String, required: true },
    raffleId: { type: String, required: true },
    shareKey: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: COLLECTIONS.raffleShares, versionKey: false }
);

raffleShareSchema.index({ id: 1 }, { unique: true });
raffleShareSchema.index({ shareKey: 1 }, { unique: true });
raffleShareSchema.index({ raffleId: 1 });

export const RaffleShare = registerModel<IRaffleShare>('RaffleShare', raffleShareSchema);
