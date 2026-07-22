export function validateEnv() {
  const required = ['JWT_SECRET', 'MONGODB_URI'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Copy .env.example to .env and fill in the values.');
    process.exit(1);
  }
  if (process.env.JWT_SECRET === 'dev-jwt-secret-change-in-production' || process.env.JWT_SECRET === 'change-me-in-production') {
    console.warn('WARNING: JWT_SECRET is set to a default value. Change it for production.');
  }
  const port = parseInt(process.env.PORT || '5000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error('PORT must be a number between 1 and 65535');
    process.exit(1);
  }
}
