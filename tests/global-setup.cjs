const { MongoMemoryServer } = require('mongodb-memory-server');
const { writeFileSync } = require('fs');

module.exports = async function globalSetup() {
  const server = await MongoMemoryServer.create({
    instance: { dbName: 'acms_test' },
    binary: { downloadTimeout: 120000 },
  });
  const uri = server.getUri();
  writeFileSync('/tmp/acms-test-mongo-uri.json', JSON.stringify({ uri }));
  global.__MONGO_SERVER__ = server;
};
