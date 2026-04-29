import { Schema } from 'mongoose';
import { COLLECTIONS } from './collections';
import { registerModel } from './register-model';
import type { IRaffle } from './types';

const raffleSchema = new Schema<IRaffle>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    status: { type: String, required: true },
    createdAt: { type: Date, required: true },
    drawnAt: { type: Date, default: null },
    createdBy: { type: String, required: true },
  },
  { collection: COLLECTIONS.raffles, versionKey: false }
);

raffleSchema.index({ id: 1 }, { unique: true });
raffleSchema.index({ createdBy: 1, createdAt: -1 });
raffleSchema.index({ status: 1 });

export const Raffle = registerModel<IRaffle>('Raffle', raffleSchema);
