# ADR-005: Use Zod for Schema Validation

## Status
Accepted

## Context
The application needs robust input validation and type safety across domain boundaries. We need a solution that:
- Provides runtime validation for external inputs
- Generates TypeScript types from schemas
- Integrates well with domain entities
- Offers clear error messages for validation failures
- Supports complex validation rules

Validation libraries considered:
- **Strummer**: Limited features, e.g. no support for Date objects.
- **Class-validator**: Decorator-based and verbose; unresolved support questions
- **Zod**: TypeScript-first with excellent type inference
- **Joi**: Mature but JavaScript-first, no TypeScript generation
- **Yup**: Good but limited TypeScript integration
- **AJV**: Fast but JSON Schema syntax is verbose

## Decision
We will use Zod for all schema validation because:

1. **TypeScript-First**: Excellent type inference and generation
2. **Schema as Source of Truth**: Types derived from validation schemas
3. **Runtime Safety**: Validates data at application boundaries
4. **Composability**: Schemas can be composed and reused
5. **Clear Errors**: Detailed validation error reporting
6. **AI-Friendly**: Simple, declarative syntax

## Implementation Pattern

### Domain Entity Schemas
```typescript
// Define schema first
const userSchema = z.object({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isEnabled: z.boolean(),
  brand: z.string().min(1).max(50),
  givenName: z.string().min(1).max(50),
  surname: z.string().min(1).max(50),
  email: z.email().max(255),
  emailVerified: z.boolean(),
  phone: z.string().min(4).max(15).nullable(),
  roles: z.array(z.string().min(1).max(50)),
})

// Derive TypeScript types
export type UserProps = Readonly<z.input<typeof userSchema>>
export type CreateUserProps = Omit<UserProps, "id" | "createdAt" | "updatedAt">
export type UpdateUserProps = Partial<Pick<UserProps, "givenName" | "surname" | "phone">>
```

### Entity Validation
```typescript
export class User extends Entity<UserProps> {
  constructor(props: UserProps) {
    super(props)
  }

  static createNew(props: CreateUserProps): User {
    const entityProps: UserProps = {
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Validate with Zod schema
    validateProps(userSchema, entityProps)
    return new User(entityProps)
  }

  updateProfile(props: UpdateUserProps): void {
    const updatedProps = { ...this.props, ...props, updatedAt: new Date() }
    validateProps(userSchema, updatedProps)
    this.props = updatedProps
  }
}
```

## Schema Organization

### Entity Schemas
- **Location**: Same file as the entity class
- **Naming**: `{entityName}Schema` (e.g., `userSchema`)
- **Purpose**: Define entity structure and basic validation

### Configuration Schemas
- **Location**: `src/infrastructure/config/schema.ts`
- **Purpose**: Validate application configuration at startup

## Validation Patterns

### Basic Types
```typescript
const schema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  email: z.email(),
  age: z.number().int().min(0).max(150),
  isActive: z.boolean(),
  tags: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
})
```

### Custom Validation
```typescript
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/[0-9]/, "Password must contain number")
  .regex(/[^A-Za-z0-9]/, "Password must contain special character")

const userSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
```

### Conditional Validation
```typescript
const userSchema = z.object({
  type: z.enum(["individual", "business"]),
  givenName: z.string().optional(),
  surname: z.string().optional(),
  companyName: z.string().optional(),
}).refine(data => {
  if (data.type === "individual") {
    return data.givenName && data.surname
  }
  if (data.type === "business") {
    return data.companyName
  }
  return false
}, {
  message: "Invalid user data for the specified type",
})
```
  
## Consequences

### Positive
- **Type Safety**: Compile-time and runtime type checking
- **Single Source of Truth**: Types derived from validation schemas
- **Clear Errors**: Detailed validation error messages
- **Composability**: Schemas can be combined and extended
- **Performance**: Fast validation with good error reporting
- **AI-Friendly**: Declarative schema syntax

### Negative
- **Bundle Size**: Adds to JavaScript bundle size
- **Learning Curve**: Developers need to learn Zod API
- **Schema Complexity**: Complex validation rules can be hard to read
- **Runtime Overhead**: Validation adds runtime cost

## Integration Points

### Domain Boundaries
- **Input Validation**: Validate all external inputs
- **Entity Construction**: Validate entity props on creation/update
- **Configuration**: Validate app config at startup

## Implementation Notes
- Define schemas before using them in entities
- Use Zod's built-in validators when possible
- Provide clear, user-friendly error messages
- Consider performance implications for large datasets
- Use schema composition for reusable validation logic
