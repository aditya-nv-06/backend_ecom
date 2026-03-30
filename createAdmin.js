const { User } = require('./models');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { connectDB } = require('./config/sequelize');

async function createAdmin() {
  try {
    await connectDB();

    // Plain password you want to use
    const plainPassword = 'Rakesh123';

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'rakesh@example.com',
      password: plainPassword,
      role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password (plain text):', plainPassword); // ✅ print password
    console.log('Password (plain text):', plainPassword);

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdmin();
