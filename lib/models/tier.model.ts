import { Schema } from 'mongoose';
import { COLLECTIONS } from './collections';
import { registerModel } from './register-model';
import type { ITier } from './types';

const tierSchema = new Schema<ITier>(
  {
    id: { type: String, required: true },
    raffleId: { type: String, required: true },
    prizeName: { type: String, required: true },
    prizeAmount: { type: Number, default: 0 },
    winnerCount: { type: Number, required: true },
    tierOrder: { type: Number, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: COLLECTIONS.tiers, versionKey: false }
);

tierSchema.index({ id: 1 }, { unique: true });
tierSchema.index({ raffleId: 1, tierOrder: 1 }, { unique: true });
tierSchema.index({ raffleId: 1 });

export const Tier = registerModel<ITier>('Tier', tierSchema);
