const { writeFileSync, readFileSync } = require('fs');
const { resolve } = require('path');

module.exports = async function globalSetup() {
  const envPath = resolve(__dirname, '..', '.env');
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    try {
      const envContent = readFileSync(envPath, 'utf-8');
      const match = envContent.match(/^MONGODB_URI=(.+)$/m);
      if (match) {
        uri = match[1].trim().replace(/^["']|["']$/g, '');
      }
    } catch {}
  }
  if (!uri) uri = 'mongodb://localhost:27017/acms';

  // Use a test-specific database name
  const qIndex = uri.indexOf('?');
  const testUri = qIndex >= 0
    ? uri.slice(0, qIndex).replace(/\/?$/, '/acms_test') + '?' + uri.slice(qIndex + 1)
    : uri.replace(/\/?$/, '') + '_test';

  writeFileSync('/tmp/acms-test-mongo-uri.json', JSON.stringify({ uri: testUri }));
  console.log('Test DB:', testUri);
};
