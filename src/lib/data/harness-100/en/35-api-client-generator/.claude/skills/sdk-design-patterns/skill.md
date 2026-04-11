---
name: sdk-design-patterns
description: "SDK/API client design patterns: builder pattern, interceptor chain, retry strategy, type-safe design, error handling, and pagination wrapper guide. Use this skill for requests involving 'SDK design', 'client patterns', 'retry strategy', 'interceptor', 'builder pattern', 'SDK error handling', 'type safety', 'SDK architecture', etc. Enhances sdk-developer's SDK design capabilities. Note: API spec parsing, test authoring, and documentation are outside the scope of this skill."
---

# SDK Design Patterns — SDK Design Patterns Guide

A pattern catalog for designing type-safe, developer-friendly API client SDKs.

## SDK Architecture

```
+------------------------------------------+
|              SDK Public API               |
|  client.users.list()                      |
|  client.orders.create({...})              |
+------------------------------------------+
|           Resource Clients                |
|  UsersClient, OrdersClient, ...           |
+------------------------------------------+
|           Middleware Chain                 |
|  Auth -> Retry -> RateLimit -> Logger     |
+------------------------------------------+
|           HTTP Transport                  |
|  fetch / axios / httpx                    |
+------------------------------------------+
```

## Builder Pattern (Client Initialization)

### TypeScript

```typescript
const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  apiKey: process.env.API_KEY,
  timeout: 30000,
  retries: 3,
  // Optional customization
  fetch: customFetch,
  headers: { 'X-Custom': 'value' },
});

// Resource access
const users = await client.users.list({ page: 1, perPage: 20 });
const user = await client.users.get('user_123');
const newUser = await client.users.create({ name: 'John Doe', email: 'john@test.com' });
```

### Python

```python
client = ApiClient(
    base_url="https://api.example.com",
    api_key=os.environ["API_KEY"],
    timeout=30.0,
    max_retries=3,
)

# Context manager support
async with ApiClient(api_key="...") as client:
    users = await client.users.list(page=1, per_page=20)
```

## Interceptor / Middleware Chain

```typescript
// Interceptor interface
interface Interceptor {
  beforeRequest(config: RequestConfig): Promise<RequestConfig>;
  afterResponse(response: Response): Promise<Response>;
  onError(error: Error): Promise<never>;
}

// Authentication interceptor
class AuthInterceptor implements Interceptor {
  async beforeRequest(config) {
    config.headers['Authorization'] = `Bearer ${this.token}`;
    return config;
  }
  async onError(error) {
    if (error.status === 401 && this.refreshToken) {
      await this.refresh();
      return this.retry(error.config);
    }
    throw error;
  }
}

// Retry interceptor
class RetryInterceptor implements Interceptor {
  async onError(error) {
    if (this.shouldRetry(error) && this.attempt < this.maxRetries) {
      await this.backoff(this.attempt);
      return this.retry(error.config);
    }
    throw error;
  }
}
```

## Retry Strategy

```typescript
class RetryStrategy {
  private maxRetries = 3;
  private baseDelay = 1000; // ms

  shouldRetry(error: ApiError): boolean {
    // Only retry on retryable errors
    return [408, 429, 500, 502, 503, 504].includes(error.status);
  }

  getDelay(attempt: number, error: ApiError): number {
    // 429: Retry-After header takes priority
    if (error.status === 429 && error.headers['retry-after']) {
      return parseInt(error.headers['retry-after']) * 1000;
    }
    // Exponential backoff + jitter
    const exponential = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * this.baseDelay;
    return Math.min(exponential + jitter, 60000); // Max 60 seconds
  }
}
```

## Type-Safe Design

### TypeScript Generic Usage

```typescript
// Resource type definitions
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

interface ListUsersParams {
  page?: number;
  perPage?: number;
  sort?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
}

// Generic resource client
class ResourceClient<T, CreateT, UpdateT, ListParams> {
  async list(params?: ListParams): Promise<PaginatedResponse<T>> { ... }
  async get(id: string): Promise<T> { ... }
  async create(data: CreateT): Promise<T> { ... }
  async update(id: string, data: UpdateT): Promise<T> { ... }
  async delete(id: string): Promise<void> { ... }
}

// Concrete client
class UsersClient extends ResourceClient<User, CreateUserRequest, UpdateUserRequest, ListUsersParams> {
  // Additional methods
  async listOrders(userId: string): Promise<Order[]> { ... }
}
```

### Python Pydantic Models

```python
from pydantic import BaseModel, Field
from datetime import datetime

class User(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime = Field(alias="createdAt")

    class Config:
        populate_by_name = True

class CreateUserRequest(BaseModel):
    name: str
    email: str
```

## Pagination Wrapper

```typescript
// Auto page traversal
class PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;

  // Iterator support
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    let response: PaginatedResponse<T> = this;
    while (true) {
      for (const item of response.data) {
        yield item;
      }
      if (!response.hasMore) break;
      response = await this.fetchNext(response.nextCursor);
    }
  }
}

// Usage
for await (const user of client.users.list()) {
  console.log(user.name);  // Auto-traverses all pages
}

// Specific page only
const page1 = await client.users.list({ perPage: 20 });
```

## Error Handling

```typescript
// Error class hierarchy
class ApiError extends Error {
  status: number;
  code: string;
  details?: any;
}

class BadRequestError extends ApiError { status = 400; }
class AuthenticationError extends ApiError { status = 401; }
class NotFoundError extends ApiError { status = 404; }
class RateLimitError extends ApiError {
  status = 429;
  retryAfter: number;
}
class InternalError extends ApiError { status = 500; }

// Usage
try {
  const user = await client.users.get('invalid_id');
} catch (e) {
  if (e instanceof NotFoundError) {
    console.log('User not found');
  } else if (e instanceof RateLimitError) {
    console.log(`Retry after ${e.retryAfter} seconds`);
  }
}
```

## SDK Quality Checklist

```markdown
### Usability
- [ ] Can get started in 3 lines or fewer (Quick Start)
- [ ] 100% IDE autocomplete support (fully typed)
- [ ] Error messages guide toward resolution
- [ ] Supports both sync and async

### Robustness
- [ ] Retry + exponential backoff
- [ ] Auto token refresh
- [ ] Auto rate limit wait
- [ ] Configurable timeouts
- [ ] Custom HTTP client injection supported

### Testing
- [ ] Unit tests for all public APIs
- [ ] Mock server integration tests
- [ ] Error scenario tests
- [ ] Pagination tests
```
