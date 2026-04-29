import mongoose from 'mongoose';
import { Participant, Raffle, RaffleShare, Template, Tier, User, Winner } from './models';

const defaultMongoUrl = 'mongodb://127.0.0.1:27017/localpro-raffle';

const globalForMongoose = globalThis as unknown as {
  mongooseIndexPromise?: Promise<void>;
};

function getMongoUrl() {
  return process.env.DATABASE_URL || defaultMongoUrl;
}

async function syncModelIndexes() {
  await Promise.all([
    User.syncIndexes(),
    Raffle.syncIndexes(),
    Tier.syncIndexes(),
    Participant.syncIndexes(),
    Winner.syncIndexes(),
    RaffleShare.syncIndexes(),
    Template.syncIndexes(),
  ]);
}

/**
 * Connect Mongoose once per process (Next.js friendly) and ensure indexes.
 */
export async function connectDb(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(getMongoUrl());
  }

  if (!globalForMongoose.mongooseIndexPromise) {
    globalForMongoose.mongooseIndexPromise = syncModelIndexes().catch((error) => {
      console.error('Failed to ensure Mongoose indexes:', error);
      globalForMongoose.mongooseIndexPromise = undefined;
    });
  }

  await globalForMongoose.mongooseIndexPromise;
}

export { User, Raffle, Tier, Participant, Winner, RaffleShare, Template } from './models';
