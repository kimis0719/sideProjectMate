import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Mongoose 연결을 캐싱하기 위한 전역 변수 설정
// 개발 환경에서 HMR(Hot Module Replacement)로 인해 파일이 변경될 때마다
// 새로운 연결이 생성되는 것을 방지합니다.
const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // 조건부 Mongoose 디버그 로깅
    if (process.env.MONGODB_DEBUG === 'true') {
      mongoose.set('debug', (collectionName: string, method: string, query: unknown) => {
        // eslint-disable-next-line no-console
        console.log(`[DB] ${collectionName}.${method}`, JSON.stringify(query));
      });
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
