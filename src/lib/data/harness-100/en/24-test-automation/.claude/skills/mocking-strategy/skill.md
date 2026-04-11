---
name: mocking-strategy
description: "Test double (Mock, Stub, Spy, Fake) selection and effective mocking strategy guide. Use this skill for 'mocking', 'Mock', 'Stub', 'Spy', 'Fake', 'test doubles', 'dependency isolation', 'external service mocking', 'DB mocking', and other test isolation strategy tasks. Enhances the mocking design capabilities of unit-tester and integration-tester. Note: overall test strategy formulation and CI integration are outside the scope of this skill."
---

# Mocking Strategy — Test Double Selection and Mocking Strategy Guide

Methodologies for effectively isolating dependencies to create reliable tests.

## Test Double Type Comparison

| Type | Purpose | Behavior | Verification Target |
|------|---------|----------|-------------------|
| **Dummy** | Fill parameters | Does nothing | Not used |
| **Stub** | Provide fixed responses | Return predefined values | State (result values) |
| **Spy** | Record calls | Real behavior + recording | Interactions (call count/args) |
| **Mock** | Define expected behavior | Pass if expectations met | Interactions (call order/args) |
| **Fake** | Lightweight implementation | Working simplified implementation | State (integration level) |

## Selection Decision Tree

```
Need to isolate external dependencies
+-- Only need response values -> Stub
+-- Need to verify call occurrence/count -> Mock or Spy
|   +-- Also need real behavior -> Spy
|   +-- Real behavior not needed -> Mock
+-- Need a working lightweight implementation -> Fake
|   +-- e.g.: InMemoryRepository, FakeEmailSender
+-- Just need type matching -> Dummy
```

## Per-layer Mocking Strategy

### Repository/DB Layer
```python
# Stub: Return fixed data
stub_repo = Mock(spec=UserRepository)
stub_repo.find_by_id.return_value = User(id=1, name="Test")

# Fake: In-memory implementation
class FakeUserRepository(UserRepository):
    def __init__(self):
        self._store = {}
    def save(self, user):
        self._store[user.id] = user
    def find_by_id(self, id):
        return self._store.get(id)
```

### External API Layer
```python
# HTTP mocking (responses / httpx_mock)
@responses.activate
def test_payment_api():
    responses.add(
        responses.POST, "https://api.pg.com/charge",
        json={"status": "success", "tx_id": "TX123"},
        status=200
    )
    result = payment_service.charge(10000)
    assert result.tx_id == "TX123"

# Timeout / Error simulation
responses.add(
    responses.POST, "https://api.pg.com/charge",
    body=ConnectionError("timeout")
)
```

### Message Queue Layer
```python
class FakeMessageBroker(MessageBroker):
    def __init__(self):
        self.published = []
    def publish(self, topic, message):
        self.published.append((topic, message))
    def assert_published(self, topic, expected_count=1):
        actual = [m for t, m in self.published if t == topic]
        assert len(actual) == expected_count
```

### Time/Date Layer
```python
# Time dependency injection
class OrderService:
    def __init__(self, clock=datetime.now):
        self.clock = clock

# Fixed time in tests
fixed_time = lambda: datetime(2024, 1, 1, 12, 0, 0)
service = OrderService(clock=fixed_time)
```

## Mocking Anti-patterns and Solutions

| Anti-pattern | Problem | Solution |
|-------------|---------|----------|
| **Over-mocking** | Tests coupled to implementation details | Switch to behavior-based testing |
| **Mock chain** | `mock.a.b.c.d()` deep mocking | Law of Demeter violation — refactor code |
| **Mock hell** | Mocking everything | Replace with Fakes, add integration tests |
| **Repetitive setup** | Same Mock setup in every test | Introduce Fixture/Builder pattern |
| **Excessive mock verification** | Overuse of `verify(mock, times(1)).method()` | Only verify essential interactions |

## Framework-specific Mocking Tools

### Python
```python
# unittest.mock
from unittest.mock import Mock, patch, MagicMock
# pytest-mock
def test_something(mocker):
    mocker.patch('module.Class.method', return_value=42)
# responses (HTTP)
# freezegun (time)
```

### JavaScript/TypeScript
```typescript
// Jest
jest.mock('./userService');
jest.spyOn(service, 'findUser').mockResolvedValue(mockUser);
// MSW (HTTP — service worker)
server.use(rest.get('/api/users', (req, res, ctx) => res(ctx.json([]))));
// Sinon (general purpose)
sinon.stub(db, 'query').resolves([]);
```

### Java/Kotlin
```java
// Mockito
@Mock UserRepository repo;
when(repo.findById(1L)).thenReturn(Optional.of(user));
verify(repo, times(1)).save(any(User.class));
// WireMock (HTTP)
// Testcontainers (real DB/Redis)
```

## Testcontainers Usage (Fake Alternative)

```python
# Isolate real DB with Docker — more realistic than Fakes
@pytest.fixture
def postgres():
    with PostgresContainer("postgres:16") as pg:
        engine = create_engine(pg.get_connection_url())
        yield engine

def test_user_crud(postgres):
    # Test with actual PostgreSQL
    repo = UserRepository(postgres)
    repo.save(User(name="test"))
    assert repo.find_by_name("test") is not None
```

## Mocking Level Decision Matrix

| Test Type | DB | External API | Message Queue | File System |
|-----------|-----|-------------|--------------|-------------|
| Unit Test | Stub/Mock | Stub | Mock | Stub |
| Integration Test | Fake/Container | WireMock | Fake | tmpdir |
| E2E Test | Real DB | Sandbox API | Real queue | Real FS |
