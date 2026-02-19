/**
 * Playwright Global Teardown
 *
 * Runs after all E2E tests to:
 * 1. Cleanup test data from the backend database (if configured)
 *
 * Environment Variables:
 *   TEST_DATA_CLEANUP: When 'true', removes test data after tests
 */
import { execSync } from 'child_process';

async function globalTeardown() {
  console.log('Cleaning up E2E test environment...');

  // Cleanup test data if configured
  if (process.env.TEST_DATA_CLEANUP === 'true') {
    try {
      console.log('Cleaning up test data...');
      execSync(
        'cd ../../../vbwd-backend && TEST_DATA_CLEANUP=true docker-compose exec -T api flask cleanup-test-data',
        {
          stdio: 'inherit',
          timeout: 30000,
        }
      );
      console.log('Test data cleaned up successfully');
    } catch (error) {
      console.warn('Could not cleanup test data:', error);
    }
  } else {
    console.log('Keeping test data (TEST_DATA_CLEANUP != true)');
  }
}

export default globalTeardown;
