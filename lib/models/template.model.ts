import { Schema } from 'mongoose';
import { COLLECTIONS } from './collections';
import { registerModel } from './register-model';
import type { ITemplate } from './types';

const templateSchema = new Schema<ITemplate>(
  {
    id: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    tiers: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: COLLECTIONS.templates, versionKey: false }
);

templateSchema.index({ id: 1 }, { unique: true });
templateSchema.index({ userId: 1, createdAt: -1 });

export const Template = registerModel<ITemplate>('Template', templateSchema);
