import { db } from '../server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createAdminUser() {
  try {
    const adminEmail = 'admin123@admin.com';
    const adminPassword = 'password123';
    
    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    
    if (existingAdmin.length > 0) {
      // Update existing admin with password
      const hashedPassword = hashPassword(adminPassword);
      await db.update(users)
        .set({ 
          password: hashedPassword,
          role: 'ADMIN',
          approved: true 
        })
        .where(eq(users.email, adminEmail));
      console.log('✅ Admin user updated with password');
    } else {
      // Create new admin user
      const hashedPassword = hashPassword(adminPassword);
      await db.insert(users).values({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        approved: true,
      });
      console.log('✅ Admin user created');
    }
    
    console.log(`\n📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('\n✅ Admin user ready!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();

