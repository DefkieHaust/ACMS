import mongoose from 'mongoose';
import { config } from './config/index.js';
import { hashPassword } from './utils/helpers.js';
import { User, Plan } from './models/index.js';

export async function seedIfNeeded() {
  const existingAdmin = await User.findOne({ type: 'site_admin' });
  if (!existingAdmin) {
    const passwordHash = await hashPassword('admin123');
    await User.create({
      type: 'site_admin',
      name: 'Super Admin',
      identifier: 'admin',
      passwordHash,
      email: 'admin@acms.app',
      status: 'active',
    });
    console.log('✓ Site admin auto-created: identifier=admin, password=admin123');
  }

  const existingPlan = await Plan.findOne();
  if (!existingPlan) {
    await Plan.create([
      {
        name: 'Starter',
        priceType: 'per-unit',
        price: 5,
        billingCycle: 'monthly',
        features: ['Up to 50 units', 'Basic support', 'Core features'],
      },
      {
        name: 'Standard',
        priceType: 'flat',
        price: 199,
        billingCycle: 'monthly',
        features: ['Unlimited units', 'Priority support', 'All features'],
      },
    ]);
    console.log('✓ Default plans created');
  }
}

async function seed() {
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB');
  await seedIfNeeded();
  await mongoose.disconnect();
  console.log('Seed complete');
}

if (process.argv[1] && (process.argv[1].endsWith('seed.js') || process.argv[1].endsWith('seed'))) {
  seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
