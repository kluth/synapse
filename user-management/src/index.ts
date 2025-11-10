import { UserManagementApp } from './app';

async function main() {
  const app = new UserManagementApp();

  try {
    // Initialize the application
    await app.initialize();

    console.log('='.repeat(60));
    console.log('USER MANAGEMENT DEMO');
    console.log('='.repeat(60) + '\n');

    // Demo: Register a new user
    console.log('📝 Registering new user...');
    const registerResult = await app.registerUser({
      email: 'alice@example.com',
      password: 'SecurePass123!',
      username: 'alice',
    });

    if (registerResult.success) {
      console.log('✅ Registration successful!');
      console.log(`   User ID: ${registerResult.user?.id}`);
      console.log(`   Token: ${registerResult.token?.substring(0, 20)}...\n`);
    } else {
      console.log(`❌ Registration failed: ${registerResult.error}\n`);
    }

    // Demo: Login
    console.log('🔐 Logging in...');
    const loginResult = await app.login({
      email: 'alice@example.com',
      password: 'SecurePass123!',
    });

    if (loginResult.success) {
      console.log('✅ Login successful!');
      console.log(`   Welcome back, ${loginResult.user?.username}!`);
      console.log(`   Token: ${loginResult.token?.substring(0, 20)}...\n`);
    } else {
      console.log(`❌ Login failed: ${loginResult.error}\n`);
    }

    // Demo: Try to register duplicate user
    console.log('📝 Attempting duplicate registration...');
    const duplicateResult = await app.registerUser({
      email: 'alice@example.com',
      password: 'AnotherPass456!',
      username: 'alice2',
    });

    if (duplicateResult.success) {
      console.log('✅ Unexpected success\n');
    } else {
      console.log(`✅ Correctly rejected: ${duplicateResult.error}\n`);
    }

    // Show statistics
    console.log('='.repeat(60));
    console.log('STATISTICS');
    console.log('='.repeat(60));
    const stats = app.getStats();
    console.log(JSON.stringify(stats, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    // Shutdown
    await app.shutdown();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
