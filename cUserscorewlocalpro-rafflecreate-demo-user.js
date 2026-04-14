const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if demo user exists
    const existing = await prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (existing) {
      console.log('Demo user already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('demo123456', 10);

    // Create demo user
    const user = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        password: hashedPassword,
        name: 'Demo User',
      },
    });

    console.log('✓ Demo user created successfully');
    console.log('Email: demo@example.com');
    console.log('Password: demo123456');
  } catch (error) {
    console.error('Error creating demo user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
