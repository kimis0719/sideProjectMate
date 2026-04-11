---
name: query-optimization-patterns
description: "SQL/NoSQL query optimization pattern, execution plan analysis, index strategy, N+1  resolution etc. database performance optimization guide. 'query optimization', 'execution plan', 'EXPLAIN', 'index ', 'N+1 ', 'slow query', 'slow query', 'DB performance' etc. database query performance improvement  this  for. bottleneck-analystand optimization-engineerof DB performance analysis  -ize. , before system profilingthis benchmark execution this of scope ."
---

# Query Optimization Patterns — query optimization pattern guide

database query performance systematicas analysisand optimizationlower methodology.

## execution plan analysis

### PostgreSQL EXPLAIN 

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.*, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.created_at > '2024-01-01'
ORDER BY o.total_amount DESC
LIMIT 10;
```

### core metric 

| metric | of | risk  |
|------|------|----------|
| **Seq Scan** | before table  | large tablefrom   |
| **Nested Loop** |   join | external tablethis   |
| **Hash Join** | hash  join | work_mem exceeding  disk for |
| **Sort** | sort | memory exceeding  external sort |
| **Bitmap Heap Scan** | index → table  | lossy map  performance lower |
| **actual time** | actual  between |   vs before  this |
| **rows** | estimated vs actual this | 10 or more this → statistics renewal |

### risk pattern detection

```
❌ Seq Scan on large_table (rows=10000000)
   → index addition necessary

❌ Sort Method: external merge (Disk: 256MB)
   → work_mem  or index sort

❌ Nested Loop (actual rows=1000000)
   → Hash Join or Merge Joinas transition

❌ estimated=100 actual=100000
   → ANALYZE executionto statistics renewal
```

## index strategy

### index typeper for

| index type | suitable  | unsuitable  |
|------------|-----------|-------------|
| B-Tree (default) | etc., scope, sort | , JSON, before search |
| Hash | etc. only | scope query |
| GIN | , JSONB, before search | simple etc./scope |
| GiST | between, scope type | simple  |
| BRIN | -basedas sortthe data |  distribution |

###  index  principle

```sql
--   rule (Leftmost Prefix)
CREATE INDEX idx_orders ON orders(status, created_at, customer_id);

-- this index lower query:
✅ WHERE status = 'PAID'
✅ WHERE status = 'PAID' AND created_at > '2024-01-01'
✅ WHERE status = 'PAID' AND created_at > '2024-01-01' AND customer_id = 123
❌ WHERE created_at > '2024-01-01'  (status )
❌ WHERE customer_id = 123          (status, created_at )

-- column  decision criteria:
-- 1. etc. cases column  (optionalalso high )
-- 2. scope cases column 
-- 3. ORDER BY column 
```

###  index

```sql
-- table  this indexonlyas query completed
CREATE INDEX idx_covering ON orders(status, created_at) INCLUDE (total_amount);

SELECT total_amount FROM orders
WHERE status = 'PAID' AND created_at > '2024-01-01';
-- Index Only Scan  → heap  necessary
```

## N+1  resolution

###  

```python
# N+1 pattern (!)
orders = Order.objects.filter(status="PAID")  # query 1
for order in orders:
    print(order.customer.name)  # query N (order countonly)
#  query: 1 + N

# Eager Loadingas resolution
orders = Order.objects.filter(status="PAID").select_related("customer")  # query 1 (JOIN)
# or
orders = Order.objects.filter(status="PAID").prefetch_related("items")  # query 2 (IN)
```

### ORMper resolution

| ORM | N+1 resolution |  |
|-----|---------|------|
| Django | `select_related` / `prefetch_related` | FK JOIN / Reverse IN |
| SQLAlchemy | `joinedload` / `subqueryload` | JOIN / query |
| TypeORM | `relations` / `@JoinColumn` | eager/lazy configuration |
| Prisma | `include` | automatic  |
| JPA | `@EntityGraph` / `JOIN FETCH` | JPQL/Criteria |

## thisthis optimization

|  | SQL | performance | suitable |
|------|-----|------|------|
| OFFSET | `LIMIT 20 OFFSET 10000` | O(N) —  | , seconds this |
| Keyset | `WHERE id > 1000 LIMIT 20` | O(1) —  | ,   |
| Cursor | encryptionthe keyset | O(1) | API, clientfor |

```sql
-- OFFSET (10000from → 10000  after )
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 10000;

-- Keyset (immediate corresponding locationas)
SELECT * FROM orders WHERE id > 10000 ORDER BY id LIMIT 20;
```

## query pattern

| pattern |  | resolution |
|---------|------|------|
| `SELECT *` | necessary column before | necessary columnonly people |
| `WHERE func(column)` | index for impossible | transformation constant as this |
| `LIKE '%keyword%'` |  | before search index(GIN) |
| query IN () | slow execution | JOINas transition |
| -based type transformation | index invalid-ize | type day |

## query optimization list

- [ ] EXPLAIN ANALYZE executionto execution plan confirmation
- [ ] Seq Scanthis ofalso-based confirmation ( data OK)
- [ ] estimated vs actual rows this confirmation
- [ ] necessary index  
- [ ] N+1 query pattern without confirmation
- [ ] thisthisthis keyset  confirmation
- [ ] necessary ORDER BY / DISTINCT removal
- [ ] transaction scope minimum confirmation
