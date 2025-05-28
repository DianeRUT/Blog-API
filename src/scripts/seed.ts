import { AppDataSource } from '../config/database.js';
import { User, UserRole } from '../entities/User.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const admin = new User();
    admin.email = 'admin@example.com';
    admin.password = await bcrypt.hash('admin123', 10);
    admin.name = 'Admin User';
    admin.role = UserRole.ADMIN;
    admin.isEmailVerified = true;

    await userRepository.save(admin);
    console.log('Admin user created successfully');

    // Create a test author
    const author = new User();
    author.email = 'author@example.com';
    author.password = await bcrypt.hash('author123', 10);
    author.name = 'Test Author';
    author.role = UserRole.AUTHOR;
    author.isEmailVerified = true;

    await userRepository.save(author);
    console.log('Test author created successfully');

    // Create a test user
    const user = new User();
    user.email = 'user@example.com';
    user.password = await bcrypt.hash('user123', 10);
    user.name = 'Test User';
    user.role = UserRole.USER;
    user.isEmailVerified = true;

    await userRepository.save(user);
    console.log('Test user created successfully');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed(); 