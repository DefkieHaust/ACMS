import { readFileSync } from 'fs';
import mongoose from 'mongoose';

let started = false;

export async function startDB() {
  if (started) return;
  started = true;
  const { uri } = JSON.parse(readFileSync('/tmp/acms-test-mongo-uri.json', 'utf-8'));
  await mongoose.connect(uri);
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
