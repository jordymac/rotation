// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/rotation_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_characters_long';

// Global test setup
beforeAll(() => {
  // Any global setup
});

afterAll(() => {
  // Any global cleanup
});