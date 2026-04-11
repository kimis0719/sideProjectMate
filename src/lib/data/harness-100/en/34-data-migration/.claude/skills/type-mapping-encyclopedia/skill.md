---
name: type-mapping-encyclopedia
description: "RDBMS-to-RDBMS data type mapping tables, RDBMS-to-NoSQL conversion patterns, character set/collation conversion, and special type handling guide. Use this skill for requests involving 'type mapping', 'data type conversion', 'MySQL PostgreSQL conversion', 'Oracle migration', 'character set conversion', 'collation', 'AUTO_INCREMENT sequence', 'JSON type', etc. Enhances schema-mapper's type conversion capabilities. Note: ETL script writing and validation queries are outside the scope of this skill."
---

# Type Mapping Encyclopedia — Data Type Mapping Reference

A comprehensive reference for RDBMS-to-RDBMS data type mapping, special type conversions, and character set handling.

## MySQL to PostgreSQL Mapping

| MySQL | PostgreSQL | Notes |
|-------|-----------|-------|
| TINYINT | SMALLINT | TINYINT UNSIGNED -> SMALLINT |
| INT | INTEGER | |
| INT UNSIGNED | BIGINT | PostgreSQL has no UNSIGNED |
| BIGINT | BIGINT | |
| FLOAT | REAL | |
| DOUBLE | DOUBLE PRECISION | |
| DECIMAL(M,N) | NUMERIC(M,N) | Identical |
| VARCHAR(N) | VARCHAR(N) | |
| CHAR(N) | CHAR(N) | |
| TEXT | TEXT | |
| MEDIUMTEXT | TEXT | PostgreSQL TEXT has no size limit |
| LONGTEXT | TEXT | |
| BLOB | BYTEA | |
| LONGBLOB | BYTEA | Or use Large Object |
| DATE | DATE | |
| DATETIME | TIMESTAMP | MySQL: not UTC; PG: timezone option |
| TIMESTAMP | TIMESTAMPTZ | MySQL: auto UTC conversion |
| TIME | TIME | |
| YEAR | SMALLINT | |
| ENUM('a','b') | VARCHAR + CHECK | Or CREATE TYPE |
| SET('a','b') | VARCHAR[] | Or normalize |
| JSON | JSONB | JSONB recommended (indexable) |
| BIT(N) | BIT(N) | |
| BOOLEAN | BOOLEAN | MySQL TINYINT(1) -> BOOLEAN |
| AUTO_INCREMENT | GENERATED ALWAYS AS IDENTITY | Or SERIAL (legacy) |

### Special Conversion Patterns

```sql
-- MySQL ENUM -> PostgreSQL
-- Method 1: CHECK constraint
CREATE TABLE orders (
    status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'shipped'))
);

-- Method 2: Custom type
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped');
CREATE TABLE orders (status order_status);

-- MySQL AUTO_INCREMENT -> PostgreSQL IDENTITY
-- MySQL:
CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY);
-- PostgreSQL:
CREATE TABLE users (id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY);

-- MySQL ON UPDATE CURRENT_TIMESTAMP -> PostgreSQL trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_timestamp BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
```

## Oracle to PostgreSQL Mapping

| Oracle | PostgreSQL | Notes |
|--------|-----------|-------|
| NUMBER | NUMERIC | Precision specification required |
| NUMBER(N,0) | INTEGER/BIGINT | Choose based on size |
| VARCHAR2(N) | VARCHAR(N) | |
| CHAR(N) | CHAR(N) | |
| CLOB | TEXT | |
| BLOB | BYTEA | |
| DATE | TIMESTAMP | Oracle DATE includes time! |
| TIMESTAMP WITH TIME ZONE | TIMESTAMPTZ | |
| RAW | BYTEA | |
| LONG | TEXT | Deprecated — migration recommended |
| NVARCHAR2 | VARCHAR | PostgreSQL defaults to UTF-8 |
| ROWID | N/A | Use ctid or custom key |
| SEQUENCE | SEQUENCE | Similar syntax |
| SYSDATE | CURRENT_TIMESTAMP | |
| NVL() | COALESCE() | |
| DECODE() | CASE WHEN | |

## RDBMS to MongoDB Conversion Patterns

### Denormalization Strategy

```
Relational:                      Document:
+- users -+  +- orders -+      {
| id       |  | id       |        _id: ObjectId,
| name     |  | user_id  |->      name: "John Doe",
| email    |  | total    |        email: "john@test.com",
+----------+  | items[]  |        orders: [
               +----------+          { total: 50000,
                                      items: [
                                        { product: "A", qty: 2 }
                                      ]
                                    }
                                  ]
                                }
```

### Embedding vs. Reference Decision

| Criterion | Embedding (Nested) | Reference (Separate) |
|-----------|-------------------|---------------------|
| Relationship | 1:1, 1:Few | 1:Many, M:N |
| Read pattern | Always queried together | Frequently queried independently |
| Update frequency | Updated with parent | Updated independently |
| Data size | < 16MB (document limit) | Size independent |
| Duplication | Acceptable | Deduplication required |

## Character Set / Collation Conversion

### MySQL to PostgreSQL

```sql
-- MySQL character set check
SHOW VARIABLES LIKE 'character_set%';
SELECT character_set_name, collation_name
FROM information_schema.columns WHERE table_name = 'users';

-- PostgreSQL collation
-- MySQL utf8mb4_general_ci -> PostgreSQL ICU collation
CREATE COLLATION korean_ci (
    provider = icu, locale = 'ko-u-ks-level1', deterministic = false
);

-- Case-insensitive comparison
-- MySQL: utf8mb4_general_ci (default)
-- PostgreSQL: citext extension or LOWER() index
CREATE EXTENSION IF NOT EXISTS citext;
ALTER TABLE users ALTER COLUMN email TYPE citext;
```

### Encoding Conversion Notes

| Issue | Symptom | Solution |
|-------|---------|----------|
| MySQL utf8 (3-byte) | Emojis break | Convert to utf8mb4 before migration |
| Latin1 to UTF8 | CJK characters corrupted | Route through binary intermediate step |
| EUC-KR to UTF8 | Rare CJK characters lost | Use mapping tables |
| CP949 to UTF8 | Extended characters need verification | Pre-validate with iconv |

## Irreversible Conversion Inventory

| Conversion | Reason for Irreversibility | Mitigation |
|-----------|--------------------------|-----------|
| ENUM -> VARCHAR | Allowed value constraint lost | Add CHECK constraint |
| UNSIGNED INT -> INT | Negative range expanded | Reinforce with business rules |
| DATETIME -> TIMESTAMPTZ | Timezone info must be added | Explicitly state assumed TZ |
| ROWID -> ctid | Physical location dependent | Replace with logical key |
| Oracle DATE -> PG DATE | Time portion lost | Use TIMESTAMP instead |
| CLOB -> TEXT | Behavior is identical | -- |

## Type Mapping Verification Queries

```sql
-- Source (MySQL)
SELECT column_name, data_type, column_type,
       character_maximum_length, numeric_precision, numeric_scale,
       is_nullable, column_default, extra
FROM information_schema.columns
WHERE table_schema = 'mydb' AND table_name = 'orders'
ORDER BY ordinal_position;

-- Target (PostgreSQL)
SELECT column_name, data_type, udt_name,
       character_maximum_length, numeric_precision, numeric_scale,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;
```
