# ADR-007: Decorator-Based Routing for API Controllers

## Status
Accepted

## Context
The application needed a routing solution that would:
- Reduce boilerplate code required to configure routes
- Utilize the dependency injection container for automatic controller discovery
- Keep routing configuration and controller logic together
- Keep middleware configuration and controller logic together
- Eliminate the need for separate router configuration files

Traditional Express.js routing requires manual route registration in separate files, creating disconnect between route definitions and their handlers. This approach leads to:
- Scattered configuration across multiple files
- Manual wiring of controllers to routes
- Difficulty in understanding the complete picture of an endpoint (route + middleware + handler)
- Boilerplate code for registering routes with the router

## Decision
We will use decorator-based routing with metadata reflection for API controllers because:

1. **Reduced Boilerplate**: Decorators eliminate the need for manual route registration
2. **Co-location**: Routes, middleware, and handlers are defined together
3. **DI Integration**: Controllers are automatically discovered and registered via naming convention
4. **Cleaner Code**: No separate router configuration files needed
5. **Better Developer Experience**: Complete endpoint definition visible at a glance

## Implementation Architecture

```typescript
@Controller("/admin/users")
export class UserController {
  @Get("/:id")
  @Authorize({ scopes: ["users:read"] })
  async getUserById(req: Request, res: Response) {
    // Handler implementation
  }
}
```

### Core Components

1. **Controller Decorator**: Defines the base path for all routes in the controller
2. **HTTP Method Decorators**: Define individual route paths and HTTP methods (`@Get`, `@Post`, etc.)
3. **Middleware Decorators**: Apply middleware to specific routes (`@Authorize`, `@HandleOAuthErrors`)
4. **Metadata Storage**: Uses `reflect-metadata` to store routing information
5. **Router Factory**: `createRouterFromDecorators()` processes metadata and creates Express router

### Discovery Mechanism
Controllers are automatically discovered using a naming convention:
- Any service ending with "Controller" in the DI container is processed
- Metadata is extracted and routes are registered automatically
- No manual registration required

## Consequences

### Positive
- **Less Boilerplate**: No need for separate route configuration files
- **Co-location**: Route definition, middleware, and handler logic are together
- **Automatic Discovery**: Controllers are found and registered automatically via DI container
- **Type Safety**: Decorators provide compile-time checking for route configurations
- **Maintainability**: Easy to understand complete endpoint definition at a glance
- **Consistency**: Standardized way to define routes across all controllers
- **Middleware Composition**: Decorators can be stacked for complex middleware chains

### Negative
- **Learning Curve**: Developers need to understand decorator pattern and metadata reflection
- **Debugging Complexity**: Route registration happens at runtime through reflection
- **Framework Lock-in**: Tight coupling to our custom decorator implementation
- **Metadata Dependency**: Requires `reflect-metadata` polyfill

## Implementation Notes

### Naming Convention
- Controllers must end with "Controller" suffix for automatic discovery
- Decorators use camelCase method names for consistency

### Metadata Keys
- `BASE_PATH`: Stores controller base path
- `ROUTES`: Stores array of route definitions (method, path, handler)
- `MIDDLEWARE`: Stores middleware configurations per route

### Router Creation Process
1. Scan DI container for services ending with "Controller"
2. Extract metadata for base path, routes, and middleware
3. Instantiate middleware from DI container
4. Register routes with Express router using extracted metadata
5. Bind controller methods to routes

### Example Usage Patterns
```typescript
// Basic route
@Get("/health")
async getHealth() { /* ... */ }

// Route with authorization
@Post("/")
@Authorize({ scopes: ["users:write"] })
async createUser() { /* ... */ }

// Multiple middleware
@Put("/:id")
@Authorize({ scopes: ["users:write"] })
@HandleOAuthErrors()
async updateUser() { /* ... */ }
```

## Alternatives Considered

1. **Manual Express Router**: More explicit but requires boilerplate and separate files
2. **Framework-based Routing** (NestJS, Fastify): Would require framework migration
3. **Route Registration Functions**: Less declarative than decorators
4. **Config-based Routing**: Would separate configuration from implementation

## Related ADRs
- ADR-002: Dependency Injection with Awilix (enables automatic controller discovery)
- ADR-001: Clean Architecture Adoption (controllers in application layer)
