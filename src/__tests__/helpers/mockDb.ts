import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer | null = null;

/**
 * 인메모리 MongoDB를 시작하고 Mongoose로 연결합니다.
 * beforeAll()에서 호출하세요.
 */
export async function setupTestDB() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // 기존 연결이 있으면 끊기
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
}

/**
 * 모든 컬렉션의 데이터를 삭제합니다.
 * afterEach()에서 호출하여 테스트 간 격리를 보장합니다.
 */
export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Mongoose 연결을 해제하고 인메모리 MongoDB를 종료합니다.
 * afterAll()에서 호출하세요.
 */
export async function teardownTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
