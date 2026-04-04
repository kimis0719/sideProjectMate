/**
 * MongoDB 스키마 정보 추출 스크립트 (읽기 전용)
 *
 * 모든 컬렉션의 필드, 타입, 인덱스를 분석하여 Markdown 파일로 출력합니다.
 * 실제 데이터는 조회하지 않으며, 스키마 구조만 추출합니다.
 *
 * 실행: node scripts/db-schema-export.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// .env.local에서 MONGODB_URI 읽기
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

// 샘플 문서에서 필드 타입 추론
function inferType(value) {
  if (value === null) return 'null';
  if (value instanceof Date) return 'Date';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Array (empty)';
    const itemType = inferType(value[0]);
    return `Array<${itemType}>`;
  }
  if (typeof value === 'object') {
    if (
      value._bsontype === 'ObjectId' ||
      (value.toString && /^[0-9a-f]{24}$/.test(value.toString()))
    ) {
      return 'ObjectId';
    }
    if (value instanceof Date) return 'Date';
    return 'Object';
  }
  return typeof value; // string, number, boolean
}

// 중첩 객체의 필드를 flat하게 추출
function extractFields(obj, prefix = '') {
  const fields = {};
  if (!obj || typeof obj !== 'object') return fields;

  for (const [key, value] of Object.entries(obj)) {
    if (key === '__v') continue; // Mongoose 버전 키 제외
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !value._bsontype &&
      !/^[0-9a-f]{24}$/.test(value.toString())
    ) {
      // 중첩 객체 → 재귀
      const nested = extractFields(value, fullKey);
      Object.assign(fields, nested);
    } else {
      fields[fullKey] = inferType(value);
    }
  }
  return fields;
}

// 여러 샘플 문서에서 필드 합집합 추출
function mergeFields(documents) {
  const allFields = {};
  for (const doc of documents) {
    const fields = extractFields(doc);
    for (const [key, type] of Object.entries(fields)) {
      if (!allFields[key]) {
        allFields[key] = new Set();
      }
      allFields[key].add(type);
    }
  }

  // Set → 문자열로 변환
  const result = {};
  for (const [key, types] of Object.entries(allFields)) {
    result[key] = Array.from(types).join(' | ');
  }
  return result;
}

async function main() {
  loadEnv();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB');

  const db = client.db();
  const dbName = db.databaseName;

  // 모든 컬렉션 목록
  const collections = await db.listCollections().toArray();
  const collectionNames = collections
    .map((c) => c.name)
    .filter((name) => !name.startsWith('system.'))
    .sort();

  console.log(`Found ${collectionNames.length} collections`);

  let markdown = `# MongoDB 스키마 정보\n\n`;
  markdown += `> Database: \`${dbName}\`\n`;
  markdown += `> Generated: ${new Date().toISOString().split('T')[0]}\n`;
  markdown += `> 이 문서는 \`node scripts/db-schema-export.js\`로 자동 생성되었습니다.\n\n`;
  markdown += `---\n\n`;

  // 요약 테이블
  markdown += `## 컬렉션 요약\n\n`;
  markdown += `| 컬렉션 | 문서 수 | 인덱스 수 | 비고 |\n`;
  markdown += `| ------ | ------: | --------: | ---- |\n`;

  const summaries = [];
  for (const name of collectionNames) {
    const col = db.collection(name);
    const count = await col.estimatedDocumentCount();
    const indexes = await col.indexes();
    summaries.push({ name, count, indexCount: indexes.length });
    markdown += `| ${name} | ${count} | ${indexes.length} | |\n`;
  }
  markdown += `\n---\n\n`;

  // 각 컬렉션 상세
  for (const name of collectionNames) {
    console.log(`Analyzing: ${name}`);
    const col = db.collection(name);

    // 샘플 문서 10개로 필드 추론
    const samples = await col.find({}).limit(10).toArray();
    const fields = mergeFields(samples);
    const indexes = await col.indexes();
    const count = summaries.find((s) => s.name === name).count;

    markdown += `## ${name}\n\n`;
    markdown += `문서 수: **${count}**\n\n`;

    // 필드 정보
    if (Object.keys(fields).length > 0) {
      markdown += `### 필드\n\n`;
      markdown += `| 필드 | 타입 |\n`;
      markdown += `| ---- | ---- |\n`;
      const sortedFields = Object.entries(fields).sort(([a], [b]) => {
        // _id를 맨 위로
        if (a === '_id') return -1;
        if (b === '_id') return 1;
        return a.localeCompare(b);
      });
      for (const [field, type] of sortedFields) {
        markdown += `| \`${field}\` | ${type} |\n`;
      }
      markdown += `\n`;
    } else {
      markdown += `> 문서 없음 (빈 컬렉션)\n\n`;
    }

    // 인덱스 정보
    markdown += `### 인덱스\n\n`;
    markdown += `| 이름 | 키 | 옵션 |\n`;
    markdown += `| ---- | -- | ---- |\n`;
    for (const idx of indexes) {
      const keys = Object.entries(idx.key)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      const options = [];
      if (idx.unique) options.push('unique');
      if (idx.sparse) options.push('sparse');
      if (idx.expireAfterSeconds !== undefined) options.push(`TTL: ${idx.expireAfterSeconds}s`);
      markdown += `| ${idx.name} | \`{ ${keys} }\` | ${options.join(', ') || '-'} |\n`;
    }
    markdown += `\n---\n\n`;
  }

  // 파일 출력
  const outputPath = path.join(__dirname, '..', 'docs', 'db-schema.md');
  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`\nExported to: ${outputPath}`);

  await client.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
