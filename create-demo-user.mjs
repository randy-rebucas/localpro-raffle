import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('demo123456', 10);
    const user = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        email: 'demo@example.com',
        password: hashedPassword,
        name: 'Demo User',
      },
    });
    console.log('✅ Demo user created:', user.email);
    console.log('📝 Email: demo@example.com');
    console.log('🔑 Password: demo123456');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
