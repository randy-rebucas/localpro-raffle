import { Schema } from 'mongoose';
import { COLLECTIONS } from './collections';
import { registerModel } from './register-model';
import type { IWinner } from './types';

const winnerSchema = new Schema<IWinner>(
  {
    id: { type: String, required: true },
    raffleId: { type: String, required: true },
    tierId: { type: String, required: true },
    participantId: { type: String, required: true },
    drawnAt: { type: Date, required: true },
    emailSent: { type: Boolean, default: false },
  },
  { collection: COLLECTIONS.winners, versionKey: false }
);

winnerSchema.index({ id: 1 }, { unique: true });
winnerSchema.index({ raffleId: 1, tierId: 1, participantId: 1 }, { unique: true });
winnerSchema.index({ raffleId: 1, drawnAt: 1 });

export const Winner = registerModel<IWinner>('Winner', winnerSchema);
