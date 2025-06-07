import { db } from './db';
import { users } from '@shared/schema';

async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing DB connection...');
    const result = await db.select().from(users).limit(1);
    console.log('✅ Database connected successfully.');
    console.log('👤 Sample User:', result[0] || 'No users found.');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testDatabaseConnection();
