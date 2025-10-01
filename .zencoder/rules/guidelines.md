# Theia Mobile Development Guidelines

## Repository Architecture: Hybrid Approach

This project uses a **hybrid repository architecture** for mobile development:

### Phase 1: Backend in Monorepo (Current)
- **Location**: `packages/core-mobile/` within Eclipse Theia monorepo
- **Purpose**: Backend mobile support, protocol definitions, connection handling
- **Package**: `@theia/core-mobile` (publishable to npm)
- **Technology**: Node.js, TypeScript, Inversify DI
- **Tests**: Jest with ts-jest

### Phase 2: Mobile App in Separate Repo (Future)
- **Location**: New `theia-mobile` repository (to be created)
- **Purpose**: React Native mobile application for iOS/Android
- **Dependencies**: Consumes published `@theia/core-mobile` from npm
- **Technology**: React Native, Expo, TypeScript
- **Tests**: Jest with React Native Testing Library

### Why This Approach?

**Backend in Monorepo:**
- ✅ Easy iteration on protocol design with Theia core
- ✅ Shared type definitions and testing utilities
- ✅ Coordinated changes with Theia backend
- ✅ Lerna manages inter-package dependencies

**Mobile App Separate:**
- ✅ Independent release cycles
- ✅ Standard React Native/Expo tooling
- ✅ Faster CI/CD for mobile-only changes
- ✅ Cleaner Metro bundler configuration
- ✅ Mobile team can work independently

### Package Publishing Strategy

`@theia/core-mobile` will be published to npm with:
- Protocol type definitions (`MobileRPC` namespace)
- Type guards and validators
- Shared interfaces (Channel, Connection, etc.)
- Test utilities for mobile client testing

Mobile app will consume:
```typescript
import { MobileRPC, MobileProtocolGuards } from '@theia/core-mobile';
```

---

# Current Phase: Backend Development

## 1. Test-Driven Development (TDD)

### 1.1 TDD Cycle
- Follow the red-green-refactor cycle:
    1. **Red**: Write a failing test that defines expected behavior
    2. **Green**: Implement minimal code to make the test pass
    3. **Refactor**: Improve code while ensuring tests remain passing
    4. **Commit**: Commit with descriptive message when tests pass

### 1.2 Testing Framework
- **Framework**: Jest with ts-jest preset
- **Test Location**: Co-located with source files (`*.spec.ts`)
- **Mock Utilities**: In `src/common/test/` directory
- **Coverage Target**: ≥80% (lines, branches, functions, statements)

### 1.3 Test Commands
```bash
# Run all mobile tests
npm run mobile:test

# Run specific test
npx jest path/to/file.spec.ts

# Watch mode
npx jest --watch

# Coverage report
npx jest --coverage
```

## 2. Package Structure

```
packages/core-mobile/
├── src/
│   ├── common/              # Shared types, protocols (published)
│   │   ├── mobile-protocol.ts
│   │   ├── mobile-protocol-guards.ts
│   │   ├── index.ts
│   │   └── test/            # Test utilities
│   │       └── mock-channel.ts
│   ├── node/                # Backend implementation (published)
│   │   ├── mobile-connection-handler.ts
│   │   ├── mobile-session-manager.ts
│   │   └── mobile-backend-module.ts
│   └── browser/             # Future: Browser-side support
├── test/                    # Package-level tests
│   └── package.spec.js
├── package.json
├── tsconfig.json
└── jest.config.js
```

## 3. Code Quality Standards

### 3.1 TypeScript
- Use strict mode
- Explicit return types on public APIs
- Avoid `any` - use `unknown` or proper types
- Export all public interfaces for mobile consumption

### 3.2 Dependency Injection
- Use InversifyJS following Theia patterns
- Property injection (not constructor injection)
- `@injectable()` decorator on classes
- `@postConstruct()` for initialization
- `.inSingletonScope()` for singleton bindings

### 3.3 Error Handling
- Use typed errors with clear messages
- Emit errors via `Emitter<Error>` for async operations
- Validate all inputs from mobile clients
- Provide detailed error context for debugging

### 3.4 Naming Conventions
- PascalCase for types, interfaces, classes
- camelCase for functions, methods, variables
- Prefix interfaces with `I` only for service interfaces
- Use descriptive names (avoid abbreviations)

## 4. Protocol Design

### 4.1 Mobile RPC Protocol
- **Namespace**: `MobileRPC` in `mobile-protocol.ts`
- **Contexts**:
  - `MobileMainContext`: Mobile → Backend calls
  - `MobileExtContext`: Backend → Mobile events
- **Method Naming**: `$methodName` for RPC methods
- **Type Safety**: All methods strongly typed

### 4.2 Type Guards
- Implement runtime validation for all protocol types
- Use `MobileProtocolGuards` namespace
- Return boolean type predicates
- Validate nested structures completely

## 5. Connection Management

### 5.1 Connection Handler
- Accept `Channel` interface for WebSocket abstraction
- Track connections with unique IDs and timestamps
- Clean up resources on disconnect
- Support multiple concurrent connections
- Emit errors for connection issues

### 5.2 Session Management
- Persist session state for reconnection
- Store workspace context, open files
- Handle session expiration
- Support session restore after disconnect

## 6. Commit Guidelines

### 6.1 Commit Message Format
```
[mobile-{feature-number}] {type}: {description}

{optional body}

Tests: {test description}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 6.2 Commit Types
- `feat`: New feature
- `test`: Add/update tests
- `refactor`: Code refactoring
- `fix`: Bug fix
- `docs`: Documentation
- `chore`: Build/tooling changes

### 6.3 Branch Naming
```
feature/mobile-{number}-{short-description}
```

Examples:
- `feature/mobile-010-mobile-protocol`
- `feature/mobile-011-websocket-handler`

## 7. Publishing Preparation

### 7.1 Package.json Requirements
- Correct `main` and `typings` entry points
- `files` array includes `lib` and `src`
- Peer dependencies properly declared
- Keywords for npm discoverability
- Public access in `publishConfig`

### 7.2 Export Strategy
- Export all public APIs from `src/common/index.ts`
- Export node-specific APIs from `src/node/index.ts`
- Include type definitions (`.d.ts` files)
- Document breaking changes in CHANGELOG

---

# Future Phase: React Native Mobile App

(To be detailed when creating separate `theia-mobile` repository)

## Planned Structure
```
theia-mobile/
├── src/
│   ├── services/
│   │   ├── connection/      # WebSocket client
│   │   ├── rpc/             # RPC client implementation
│   │   └── extension/       # Extension management
│   ├── components/
│   │   ├── Explorer/
│   │   ├── Editor/
│   │   └── Terminal/
│   └── types/               # Generated from @theia/core-mobile
├── ios/
├── android/
└── e2e/
```

## Integration Pattern
```typescript
// In theia-mobile app
import { MobileRPC } from '@theia/core-mobile';

// Use protocol types
const initOptions: MobileRPC.MobileInitializeOptions = {
  clientInfo: { name: 'TheiaMobile', version: '1.0.0' },
  capabilities: {}
};
```

---

Spring Boot Guidelines

## 1. Prefer Constructor Injection over Field/Setter Injection
* Declare all the mandatory dependencies as `final` fields and inject them through the constructor.
* Spring will auto-detect if there is only one constructor, no need to add `@Autowired` on the constructor.
* Avoid field/setter injection in production code.

**Explanation:**

* Making all the required dependencies as `final` fields and injecting them through constructor make sure that the object is always in a properly initialized state using the plain Java language feature itself. No need to rely on any framework-specific initialization mechanism.
* You can write unit tests without relying on reflection-based initialization or mocking.
* The constructor-based injection clearly communicates what are the dependencies of a class without having to look into the source code.
* Spring Boot provides extension points as builders such as `RestClient.Builder`, `ChatClient.Builder`, etc. Using constructor-injection, we can do the customization and initialize the actual dependency.

```java
@Service
public class OrderService {
   private final OrderRepository orderRepository;
   private final RestClient restClient;

   public OrderService(OrderRepository orderRepository, 
                       RestClient.Builder builder) {
       this.orderRepository = orderRepository;
       this.restClient = builder
               .baseUrl("http://catalog-service.com")
               .requestInterceptor(new ClientCredentialTokenInterceptor())
               .build();
   }

   //... methods
}
```

## 2. Prefer package-private over public for Spring components
* Declare Controllers, their request-handling methods, `@Configuration` classes and `@Bean` methods with default (package-private) visibility whenever possible. There's no obligation to make everything `public`.

**Explanation:**

* Keeping classes and methods package-private reinforces encapsulation and abstraction by hiding implementation details from the rest of your application.
* Spring Boot's classpath scanning will still detect and invoke package-private components (for example, invoking your `@Bean` methods or controller handlers), so you can safely restrict visibility to only what clients truly need. This approach confines your internal APIs to a single package while still allowing the framework to wire up beans and handle HTTP requests.

## 3. Organize Configuration with Typed Properties
* Group application-specific configuration properties with a common prefix in `application.properties` or `.yml`.
* Bind them to `@ConfigurationProperties` classes with validation annotations so that the application will fail fast if the configuration is invalid.
* Prefer environment variables instead of profiles for passing different configuration properties for different environments.

**Explanation:**

* By grouping and binding configuration in a single `@ConfigurationProperties` bean, you centralize both the property names and their validation rules.
  In contrast, using `@Value("${…}")` across many components forces you to update each injection point whenever a key or validation requirement changes.
* Overusing profiles to customize the application configuration may lead to unexpected issues due to the order of profiles specified.
  As you can enable multiple profiles with different combinations, making sense of the effective application configuration becomes tricky.

## 4. Define Clear Transaction Boundaries
* Define each Service-layer method as a transactional unit.
* Annotate query-only methods with `@Transactional(readOnly = true)`.
* Annotate data-modifying methods with `@Transactional`.
* Limit the code inside each transaction to the smallest necessary scope.

**Explanation:**

* **Single Unit of Work:** Group all database operations for a given use case into one atomic unit, which in Spring Boot is typically a `@Service` annotated class method. This ensures that either all operations succeed or none do.
* **Connection Reuse:** A `@Transactional` method runs on a single database connection for its entire scope, avoiding the overhead of acquiring and returning connections from the connection pool for each operation.
* **Read-only Optimizations:** Marking methods as `readOnly = true` disables unnecessary dirty-checking and flushes, improving performance for pure reads.
* **Reduced Contention:** Keeping transactions as brief as possible minimizes lock duration, lowering the chance of contention in high-traffic applications.

## 5. Disable Open Session in View Pattern
* While using Spring Data JPA, disable the Open Session in View filter by setting ` spring.jpa.open-in-view=false` in `application.properties/yml.`

**Explanation:**

* Open Session In View (OSIV) filter transparently enables loading the lazy associations while rendering the view or serializing JPA entities. This may lead to the N + 1 Select problem.
* Disabling OSIV forces you to fetch exactly the associations you need via fetch joins, entity graphs, or explicit queries, and hence you can avoid unexpected N + 1 selects and `LazyInitializationExceptions`.

## 6. Separate Web Layer from Persistence Layer
* Don't expose entities directly as responses in controllers.
* Define explicit request and response record (DTO) classes instead.
* Apply Jakarta Validation annotations on your request records to enforce input rules.

**Explanation:**

* Returning or binding directly to entities couples your public API to your database schema, making future changes riskier.
* DTOs let you clearly declare exactly which fields clients can send or receive, improving clarity and security.
* With dedicated DTOs per use case, you can annotate fields for validation without relying on complex validation groups.
* Use Java bean mapper libraries to simplify DTO conversions. Prefer MapStruct library that can generate bean mapper implementation at compile time so that there won't be runtime reflection overhead.

## 7. Follow REST API Design Principles
* **Versioned, resource-oriented URLs:** Structure your endpoints as `/api/v{version}/resources` (e.g. `/api/v1/orders`).
* **Consistent patterns for collections and sub-resources:** Keep URL conventions uniform (for example, `/posts` for posts collection and `/posts/{slug}/comments` for comments of a specific post).
* **Explicit HTTP status codes via ResponseEntity:** Use `ResponseEntity<T>` to return the correct status (e.g. 200 OK, 201 Created, 404 Not Found) along with the response body.
* Use pagination for collection resources that may contain an unbounded number of items.
* The JSON payload must use a JSON object as a top-level data structure to allow for future extension.
* Use snake_case or camelCase for JSON property names consistently.

**Explanation:**

* **Predictability and discoverability:** Adhering to well-known REST conventions makes your API intuitive. Clients can guess URLs and behaviors without extensive documentation.
* **Reliable client integrations:** Standardized URL structures, status codes, and headers enable consumers to build against your API with confidence, knowing exactly what each response will look like.
* For more comprehensive REST API Guidelines, please refer [Zalando RESTful API and Event Guidelines](https://opensource.zalando.com/restful-api-guidelines/).

## 8. Use Command Objects for Business Operations
* Create purpose-built command records (e.g., `CreateOrderCommand`) to wrap input data.
* Accept these commands in your service methods to drive creation or update workflows.

**Explanation:**

* Using the use-case specific Command and Query objects clearly communicates what input data is expected from the caller.
  Otherwise, the caller had to guess whether they should create and pass the unique key or created_date, or they will be generated by the server/database.

## 9. Centralize Exception Handling
* Define a global handler class annotated with `@ControllerAdvice` (or `@RestControllerAdvice` for REST APIs) using `@ExceptionHandler` methods to handle specific exceptions.
* Return consistent error responses. Consider using the ProblemDetails response format ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)).

**Explanation:**

* We should always handle all possible exceptions and return a standard error response instead of throwing exceptions.
* It is better to centralize the exception handling in a `GlobalExceptionHandler` using `(Rest)ControllerAdvice` instead of duplicating the try/catch exception handling logic across the controllers.

## 10. Actuator
* Expose only essential actuator endpoints (such as `/health`, `/info`, `/metrics`) without requiring authentication. All the other actuator endpoints must be secured.

**Explanation:**

* Endpoints like `/actuator/health` and `/actuator/metrics` are critical for external health checks and metric collection (e.g., by Prometheus). Allowing these to be accessed anonymously ensures monitoring tools can function without extra credentials. All the remaining endpoints should be secured.
* In non-production environments (DEV, QA), you can expose additional actuator endpoints such as `/actuator/beans`, `/actuator/loggers` for debugging purpose.

## 11. Internationalization with ResourceBundles
* Externalize all user-facing text such as labels, prompts, and messages into ResourceBundles rather than embedding them in code.

**Explanation:**

* Hardcoded strings make it difficult to support multiple languages. By placing your labels, error messages, and other text in locale-specific ResourceBundle files, you can maintain separate translations for each language.
* At runtime, Spring can load the appropriate bundle based on the user's locale or a preference setting, making it simple to add new languages and switch between them dynamically.

## 12. Use Testcontainers for integration tests
* Spin up real services (databases, message brokers, etc.) in your integration tests to mirror production environments.

**Explanation:**

* Most of the modern applications use a wide range of technologies such as SQL/NoSQL databases, key-value stores, message brokers, etc. Instead of using in-memory variants or mocks, Testcontainers can spin up those dependencies as Docker containers and allow you to test using the same type of dependencies that you will use in the production. This reduces environment inconsistencies and increases confidence in your integration tests.
* Always use docker images with a specific version of the dependency that you are using in production instead of using the `latest` tag.

## 13. Use random port for integration tests
* When writing integration tests, start the application on a random available port to avoid port conflicts by annotating the test class with:

    ```java
    @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
    ```

**Explanation:**

* **Avoid conflicts in CI/CD:** In your CI/CD environment, there can be multiple builds running in parallel on the same server/agent. In such cases, it is better to run the integration tests using a random available port rather than a fixed port to avoid port conflicts.

## 14. Logging
* **Use a proper logging framework.**  
  Never use `System.out.println()` for application logging. Rely on SLF4J (or a compatible abstraction) and your chosen backend (Logback, Log4j2, etc.).

* **Protect sensitive data.**  
  Ensure that no credentials, personal information, or other confidential details ever appear in log output.

* **Guard expensive log calls.**  
  When building verbose messages at `DEBUG` or `TRACE` level, especially those involving method calls or complex string concatenations, wrap them in a level check or use suppliers:

```java
if (logger.isDebugEnabled()) {
    logger.debug("Detailed state: {}", computeExpensiveDetails());
}

// using Supplier/Lambda expression
logger.atDebug()
	.setMessage("Detailed state: {}")
	.addArgument(() -> computeExpensiveDetails())
    .log();
```

**Explanation:**

* **Flexible verbosity control:** A logging framework lets you adjust what gets logged and where with the support for tuning log levels per environment (development, testing, production).

* **Rich contextual metadata:** Beyond the message itself, you can capture class/method names, thread IDs, process IDs, and any custom context via MDC, aiding diagnosis.

* **Multiple outputs and formats:** Direct logs to consoles, rolling files, databases, or remote systems, and choose formats like JSON for seamless ingestion into ELK, Loki, or other log-analysis tools.

* **Better tooling and analysis:** Structured logs and controlled log levels make it easier to filter noise, automate alerts, and visualize application behavior in real time.