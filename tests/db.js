import { readFileSync } from 'fs';
import mongoose from 'mongoose';

let started = false;

export async function startDB() {
  if (started) return;
  started = true;
  let uri;
  try {
    const data = JSON.parse(readFileSync('/tmp/acms-test-mongo-uri.json', 'utf-8'));
    uri = data.uri;
  } catch {
    uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/acms-test';
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

export async function stopDB() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

export async function clearDB() {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
