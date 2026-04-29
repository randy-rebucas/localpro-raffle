import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const defaultMongoUrl = 'mongodb://127.0.0.1:27017/localpro-raffle';

function isDuplicateKeyError(error) {
  return typeof error === 'object' && error !== null && error.code === 11000;
}

async function main() {
  const mongoUrl = process.env.DATABASE_URL || defaultMongoUrl;

  try {
    await mongoose.connect(mongoUrl);
    const users = mongoose.connection.collection('users');

    const email = 'demo@example.com';
    const existing = await users.findOne({ email });

    if (existing) {
      console.log('✅ Demo user already exists:', email);
      return;
    }

    const hashedPassword = await bcrypt.hash('demo123456', 10);
    const now = new Date();
    const userId = randomUUID();

    try {
      await users.insertOne({
        id: userId,
        email,
        password: hashedPassword,
        name: 'Demo User',
        createdAt: now,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        console.log('✅ Demo user already exists:', email);
        return;
      }
      throw error;
    }

    console.log('✅ Demo user created:', email);
    console.log('📝 Email: demo@example.com');
    console.log('🔑 Password: demo123456');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await main();
