---
name: data-validation-patterns
description: "Migration data validation patterns: row count comparison, checksums, sampling validation, FK integrity, and business rule validation query design guide. Use this skill for requests involving 'data validation', 'migration validation', 'checksum', 'row count comparison', 'integrity validation', 'regression testing', 'Go/No-Go checklist', etc. Enhances validation-engineer's validation design capabilities. Note: schema mapping and rollback planning are outside the scope of this skill."
---

# Data Validation Patterns — Migration Validation Patterns Guide

A systematic collection of patterns and queries for verifying data integrity before and after migration.

## Validation Layer Model

```
Level 5: Business Rule Validation  <- Domain-specific rules
Level 4: Cross-Reference Validation <- Inter-table relationships
Level 3: Data Value Validation      <- Transformation accuracy
Level 2: Schema Validation          <- Structural match
Level 1: Count Validation           <- Row/column count match
```

## Level 1: Count Validation

```sql
-- Source
SELECT 'orders' AS table_name, COUNT(*) AS row_count FROM source.orders
UNION ALL
SELECT 'customers', COUNT(*) FROM source.customers
UNION ALL
SELECT 'products', COUNT(*) FROM source.products;

-- Target (same query)
SELECT 'orders' AS table_name, COUNT(*) AS row_count FROM target.orders
UNION ALL ...;

-- Difference comparison
SELECT s.table_name,
       s.row_count AS source_count,
       t.row_count AS target_count,
       s.row_count - t.row_count AS diff,
       CASE WHEN s.row_count = t.row_count THEN 'PASS' ELSE 'FAIL' END AS status
FROM source_counts s JOIN target_counts t ON s.table_name = t.table_name;
```

## Level 2: Schema Validation

```sql
-- Column count comparison
SELECT s.table_name,
       s.col_count AS source_cols,
       t.col_count AS target_cols,
       CASE WHEN s.col_count = t.col_count THEN 'PASS' ELSE 'CHECK' END
FROM (SELECT table_name, COUNT(*) col_count
      FROM source_information_schema.columns GROUP BY table_name) s
JOIN (SELECT table_name, COUNT(*) col_count
      FROM target_information_schema.columns GROUP BY table_name) t
ON s.table_name = t.table_name;

-- NULL constraint comparison
-- PK/FK constraint comparison
-- Index comparison
```

## Level 3: Data Value Validation

### Checksum Comparison

```sql
-- Row-level checksum (PostgreSQL)
SELECT id, md5(ROW(order_id, customer_id, total_amount, created_at)::text) AS row_hash
FROM orders;

-- Full table checksum
SELECT md5(string_agg(row_hash, '' ORDER BY id)) AS table_hash
FROM (
    SELECT id, md5(ROW(*)::text) AS row_hash FROM orders
) t;

-- MySQL checksum
CHECKSUM TABLE orders;
```

### Sampling Validation

```python
def sample_validation(source_conn, target_conn, table, pk_col, sample_size=1000):
    """Compare N randomly sampled rows one-by-one"""
    # 1. Random PK extraction
    pks = source_conn.execute(
        f"SELECT {pk_col} FROM {table} ORDER BY RANDOM() LIMIT {sample_size}"
    ).fetchall()

    mismatches = []
    for pk in pks:
        source_row = source_conn.execute(
            f"SELECT * FROM {table} WHERE {pk_col} = %s", (pk,)
        ).fetchone()
        target_row = target_conn.execute(
            f"SELECT * FROM {table} WHERE {pk_col} = %s", (pk,)
        ).fetchone()

        if not rows_equal(source_row, target_row):
            mismatches.append({
                'pk': pk, 'source': source_row, 'target': target_row,
                'diff_columns': find_diff_columns(source_row, target_row)
            })

    return {
        'table': table,
        'sample_size': sample_size,
        'mismatches': len(mismatches),
        'match_rate': (sample_size - len(mismatches)) / sample_size,
        'details': mismatches[:10]  # Top 10 only
    }
```

### Aggregate Comparison

```sql
-- Numeric column aggregate comparison
SELECT
    COUNT(*) AS cnt,
    SUM(total_amount) AS sum_amount,
    AVG(total_amount) AS avg_amount,
    MIN(total_amount) AS min_amount,
    MAX(total_amount) AS max_amount,
    COUNT(DISTINCT customer_id) AS unique_customers
FROM orders
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';
```

## Level 4: Cross-Reference Validation

```sql
-- FK integrity: Does orders.customer_id exist in customers.id?
SELECT o.order_id, o.customer_id
FROM target.orders o
LEFT JOIN target.customers c ON o.customer_id = c.id
WHERE c.id IS NULL;
-- Result must be 0 rows to pass

-- Reverse: Do all customers with orders exist?
SELECT DISTINCT o.customer_id
FROM source.orders o
WHERE o.customer_id NOT IN (SELECT id FROM target.customers);
```

## Level 5: Business Rule Validation

```sql
-- Rule 1: Order total = sum of order items
SELECT o.order_id, o.total_amount, SUM(oi.price * oi.quantity) AS calc_total,
       ABS(o.total_amount - SUM(oi.price * oi.quantity)) AS diff
FROM target.orders o
JOIN target.order_items oi ON o.id = oi.order_id
GROUP BY o.order_id, o.total_amount
HAVING ABS(o.total_amount - SUM(oi.price * oi.quantity)) > 0.01;

-- Rule 2: Status transition validity
SELECT * FROM target.orders
WHERE status = 'SHIPPED' AND paid_at IS NULL;
-- Shipping without payment is invalid -> must be 0 rows

-- Rule 3: Date ordering
SELECT * FROM target.orders
WHERE created_at > paid_at OR paid_at > shipped_at;
-- Created > Paid > Shipped order violation -> must be 0 rows
```

## Go/No-Go Checklist

```markdown
## Migration Go/No-Go Decision

### Must Pass (all must be PASS for Go)
- [ ] L1: 100% row count match across all tables
- [ ] L2: Schema structure match (column count, types, constraints)
- [ ] L3: 100% checksum match (or 99.99% sample match)
- [ ] L4: 0 FK integrity violations
- [ ] L5: 0 critical business rule violations

### Warnings Allowed (document and Go)
- [ ] Date/time millisecond differences (from timezone conversion)
- [ ] String trailing whitespace differences
- [ ] Decimal trailing digit rounding differences

### Automatic Decision
All PASS -> Go
1+ mandatory FAIL -> No-Go
Warnings only -> Conditional Go (approval required)
```

## Validation Automation Framework

```python
class MigrationValidator:
    def __init__(self, source, target, tables):
        self.source = source
        self.target = target
        self.tables = tables
        self.results = []

    def run_all(self):
        for table in self.tables:
            self.results.append({
                'table': table,
                'row_count': self.check_row_count(table),
                'checksum': self.check_checksum(table),
                'fk_integrity': self.check_fk(table),
                'business_rules': self.check_rules(table),
            })
        return self.generate_report()

    def verdict(self):
        failed = [r for r in self.results if not r['all_pass']]
        return "GO" if not failed else "NO-GO"
```
