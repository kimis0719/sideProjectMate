---
name: openapi-spec-patterns
description: "OpenAPI 3.x spec analysis patterns, schema normalization, authentication method mapping, pagination/error pattern extraction, and GraphQL/gRPC spec interpretation guide. Use this skill for requests involving 'OpenAPI', 'Swagger', 'spec analysis', 'schema normalization', 'API authentication', 'pagination patterns', 'GraphQL schema', 'gRPC proto', etc. Enhances spec-parser's spec analysis capabilities. Note: SDK code generation and test authoring are outside the scope of this skill."
---

# OpenAPI Spec Patterns — API Spec Analysis Patterns Guide

Methodology for effectively analyzing OpenAPI/GraphQL/gRPC specs and extracting the metadata needed for SDK generation.

## OpenAPI 3.x Analysis Procedure

### 1. Endpoint Grouping

```yaml
# Tag-based grouping -> SDK class mapping
paths:
  /users:
    get:
      tags: [Users]         # -> UsersClient.list()
    post:
      tags: [Users]         # -> UsersClient.create()
  /users/{id}:
    get:
      tags: [Users]         # -> UsersClient.get(id)
    put:
      tags: [Users]         # -> UsersClient.update(id, data)
    delete:
      tags: [Users]         # -> UsersClient.delete(id)
  /users/{id}/orders:
    get:
      tags: [Users, Orders] # -> UsersClient.listOrders(id)
```

### Mapping Rules

| HTTP Method | Pattern | SDK Method Name |
|------------|---------|----------------|
| GET /resources | List | `list()` |
| GET /resources/{id} | Detail | `get(id)` |
| POST /resources | Create | `create(data)` |
| PUT /resources/{id} | Full update | `update(id, data)` |
| PATCH /resources/{id} | Partial update | `patch(id, data)` |
| DELETE /resources/{id} | Delete | `delete(id)` |
| POST /resources/{id}/action | Action | `actionName(id, data)` |

### 2. Authentication Method Mapping

```yaml
securitySchemes:
  BearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
  ApiKeyAuth:
    type: apiKey
    in: header
    name: X-API-Key
  OAuth2:
    type: oauth2
    flows:
      authorizationCode:
        authorizationUrl: https://auth.example.com/authorize
        tokenUrl: https://auth.example.com/token
        scopes:
          read: Read access
          write: Write access
```

| Auth Type | SDK Implementation | Code Pattern |
|----------|-------------------|-------------|
| Bearer | Header interceptor | `Authorization: Bearer {token}` |
| API Key | Header/query interceptor | `X-API-Key: {key}` |
| OAuth2 | Token manager + refresh | Auto refresh_token handling |
| Basic | Header | `Authorization: Basic {base64}` |

### 3. Pagination Pattern Detection

```yaml
# Pattern 1: Offset-based
parameters:
  - name: offset
    in: query
    schema: { type: integer }
  - name: limit
    in: query
    schema: { type: integer, default: 20 }

# Pattern 2: Cursor-based
parameters:
  - name: cursor
    in: query
    schema: { type: string }
  - name: limit
    in: query
    schema: { type: integer }

# Pattern 3: Page-based
parameters:
  - name: page
    in: query
    schema: { type: integer }
  - name: per_page
    in: query
    schema: { type: integer }
```

| Detection Pattern | SDK Implementation |
|------------------|-------------------|
| offset/limit | `listAll()` auto page traversal |
| cursor/after | `iterate()` iterator |
| page/per_page | `listPage(page)` |
| Link header | HTTP Link header parsing |

### 4. Error Response Patterns

```yaml
# Standard error structure extraction
responses:
  '400':
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'

components:
  schemas:
    Error:
      type: object
      properties:
        code: { type: string }
        message: { type: string }
        details: { type: array, items: { $ref: '#/components/schemas/ErrorDetail' } }
```

### SDK Error Class Mapping

| HTTP Status | SDK Exception | Retry |
|------------|--------------|-------|
| 400 | BadRequestError | No |
| 401 | AuthenticationError | No (once after token refresh) |
| 403 | PermissionError | No |
| 404 | NotFoundError | No |
| 409 | ConflictError | No |
| 422 | ValidationError | No |
| 429 | RateLimitError | Yes (Retry-After) |
| 500 | InternalError | Yes (exponential backoff) |
| 502/503/504 | ServiceUnavailableError | Yes |

## Schema Normalization

### Circular Reference Handling

```yaml
# Circular: User -> Order -> User
User:
  properties:
    orders:
      type: array
      items: { $ref: '#/components/schemas/Order' }
Order:
  properties:
    user: { $ref: '#/components/schemas/User' }  # Circular!

# Resolution: Lazy Reference
# TypeScript: type User = { orders: () => Order[] }
# Python: User = ForwardRef('User')
```

### allOf/oneOf/anyOf Interpretation

```yaml
# allOf -> Intersection (inheritance/extension)
UpdateUser:
  allOf:
    - $ref: '#/components/schemas/BaseUser'
    - type: object
      properties:
        password: { type: string }
# -> class UpdateUser extends BaseUser { password?: string }

# oneOf -> Union (exclusive choice)
Pet:
  oneOf:
    - $ref: '#/components/schemas/Cat'
    - $ref: '#/components/schemas/Dog'
  discriminator:
    propertyName: petType
# -> type Pet = Cat | Dog (discriminated union)

# anyOf -> Flexible union
Filter:
  anyOf:
    - type: string
    - type: integer
    - type: array
      items: { type: string }
# -> type Filter = string | number | string[]
```

## GraphQL Schema Analysis

```graphql
# Query -> SDK read methods
type Query {
    user(id: ID!): User        # -> client.users.get(id)
    users(first: Int, after: String): UserConnection  # -> client.users.list()
}

# Mutation -> SDK write methods
type Mutation {
    createUser(input: CreateUserInput!): User  # -> client.users.create(input)
    updateUser(id: ID!, input: UpdateUserInput!): User
}

# Connection pattern -> Auto-pagination
type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
}
```

## gRPC Proto Analysis

```protobuf
service UserService {
    rpc GetUser (GetUserRequest) returns (User);           // -> client.getUser(id)
    rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
    rpc CreateUser (CreateUserRequest) returns (User);
    rpc StreamUsers (StreamRequest) returns (stream User); // -> Streaming API
}
```

| gRPC Pattern | SDK Implementation |
|-------------|-------------------|
| Unary | Standard async method |
| Server Stream | AsyncIterator |
| Client Stream | Stream send method |
| Bidirectional | Bidirectional stream |
