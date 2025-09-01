import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      name: 'System Admin',
      email: 'admin@company.com', // Change this to your admin email
      password: 'admin123', // Change this to a strong password
      role: 'admin'
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('Admin user created successfully:');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('Please change the default password after first login');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();