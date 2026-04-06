import { PrismaClient } from '@prisma/client';

export default new PrismaClient({
  datasources: {
    db: {
      accelerateUrl: process.env.DATABASE_URL,
    },
  },
});