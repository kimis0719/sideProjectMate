---
name: caching-strategy-selector
description: "caching strategy(Cache Aside, Write Through, Write Behind etc.) optional and Redis/Memcached for, TTL , cache invalid-ize pattern guide. 'caching strategy', 'Redis', 'cache invalid-ize', 'TTL', 'Cache Aside', 'Write Through', 'CDN caching', 'cache ' etc. caching   this  for. optimization-engineerof caching   -ize. , before performance profilingthis benchmark this of scope ."
---

# Caching Strategy Selector — caching strategy optional guide

-based caching strategy optionaland and-basedas lower methodology.

## caching strategy 

### 1. Cache Aside (Lazy Loading)

```
: App → Cache confirmation →  → DB query → Cache  → 
: App → DB  → Cache invalid-ize(deletion)
```

|  |  |
|------|------|
|  for-based |  request upper  |
| cache   DB  | -modification-  cases |
| necessary dataonly cache | data day also  |

### 2. Write Through

```
: App → Cache  → DB  (synchronous)
: App → Cache confirmation → upper 
```

|  |  |
|------|------|
| - consistency |  latency  |
| cache upper  | forlower  dataalso cache |

### 3. Write Behind (Write Back)

```
: App → Cache  → asynchronous as DB 
: App → Cache confirmation → upper 
```

|  |  |
|------|------|
|  performance -ize | cache   data  |
| DB lower -ize |  complex |

### strategy optional 

| requiredmatter | Cache Aside | Write Through | Write Behind |
|---------|------------|---------------|-------------|
|   | ★★★ | ★★ | ★★ |
|   | ★ | ★ | ★★★ |
| consistency important | ★★ | ★★★ | ★ |
| performance important | ★★ | ★ | ★★★ |
|  simple | ★★★ | ★★ | ★ |
| data  impossible | ★★★ | ★★★ | ★ |

## cache invalid-ize pattern

### 1. TTL (Time-To-Live)

```python
# TTL configuration guide
CACHE_TTL = {
    "user_profile": 300,      # 5minutes — week change 
    "product_list": 60,       # 1minutes — between change frequency
    "stock_count": 10,        # 10seconds — week change
    "config": 3600,           # 1between — of change  
    "session": 86400,         # 24between — session countpeople
}

# Jitter addition (cache  )
import random
ttl = base_ttl + random.randint(0, base_ttl // 10)
```

### 2. Event-Based Invalidation

```python
# event  invalid-ize
@event_handler("user.updated")
def invalidate_user_cache(event):
    cache.delete(f"user:{event.user_id}")
    cache.delete(f"user_profile:{event.user_id}")
    # related  cachealso invalid-ize
    cache.delete("user_list:page:*")
```

### 3. Version-Based

```python
# before keyas in invalid-ize
version = cache.get("product_version") or 1
key = f"product_list:v{version}"
# invalid-ize: beforeonly 
cache.incr("product_version")
```

## cache  resolution

### Cache Stampede (Thundering Herd)

```
: cache only   requestthis  DBin 
resolution:

1. Mutex Lock
   if cache.miss(key):
       if cache.lock(key + ":lock", timeout=5):
           result = db.query()
           cache.set(key, result, ttl)
           cache.unlock(key + ":lock")
       else:
           wait_and_retry()

2. Stale-While-Revalidate
   cache.set(key, data, ttl=300, stale_ttl=600)
   # TTL only afterinalso stale data lower the renewal

3. Probabilistic Early Expiry
   delta = ttl * beta * log(random())
   if now() - fetched_at > ttl + delta:
       refresh()
```

### Cache Penetration

```
: lower  key repetition request →  DB 
resolution:
1.  filter:  possible before 
2.  result caching: cache.set(key, NULL, ttl=60)
3. request verification: validlower  key before 
```

### Cache Avalanche

```
:  cache  only → DB andlower
resolution:
1. TTL variance: TTL + random jitter
2. phased only: importantalsoper different TTL
3. (Warm-up): deployment  cache before -based
```

## cache layer 

```
L1: as cache (process)
    ├── for: ~100MB
    ├── speed: ~0.1ms
    └── suitable: configuration, constant,  

L2: variance cache (Redis/Memcached)
    ├── for: ~10GB
    ├── speed: ~1ms
    └── suitable: session, as, 

L3: CDN cache (CloudFront/Cloudflare)
    ├── for: limited
    ├── speed: edgefrom ~5ms
    └── suitable: -based , API 

L4:  cache
    ├── Cache-Control: max-age, stale-while-revalidate
    └── ETag / Last-Modified
```

## Redis data  optional

|  | suitable | example |
|------|------|------|
| String | simple key-value | session, configuration,  |
| Hash |   | user as |
| List |   |   upper (LPUSH + LTRIM) |
| Set |   |  user |
| Sorted Set |  | ,  |
| HyperLogLog |   | UV  |
