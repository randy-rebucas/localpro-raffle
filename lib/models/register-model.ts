import mongoose, { type Model, type Schema } from 'mongoose';

/** Next.js HMR-safe model registration. */
export function registerModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}
