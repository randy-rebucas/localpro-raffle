import { Schema } from 'mongoose';
import { COLLECTIONS } from './collections';
import { registerModel } from './register-model';
import type { IParticipant } from './types';

const participantSchema = new Schema<IParticipant>(
  {
    id: { type: String, required: true },
    raffleId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, default: null },
    emailKey: { type: String, required: true },
    addedAt: { type: Date, required: true },
  },
  { collection: COLLECTIONS.participants, versionKey: false }
);

participantSchema.index({ id: 1 }, { unique: true });
participantSchema.index({ raffleId: 1, name: 1, emailKey: 1 }, { unique: true });
participantSchema.index({ raffleId: 1, addedAt: 1 });

export const Participant = registerModel<IParticipant>('Participant', participantSchema);
