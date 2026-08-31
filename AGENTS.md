# AGENTS.md

AdonisJS 7 + Inertia.js + React 19 + TypeScript + PostgreSQL

## Commands

```bash
# Testing (Japa)
npm test                                              # all tests
node ace test --files="tests/unit/models/x.spec.ts"  # single file
node ace test --tests="test name"                    # single test
node ace test --groups="Group Name"                  # single group

# Code Quality
npm run lint | fix | format | typecheck

# Build & Dev
npm run build | dev | start
node ace queue:work                                  # start workers

# Scaffolding
node ace make:job|action|notification|service <name>
```

## File Naming

| Location              | Convention         | Notes                               |
| --------------------- | ------------------ | ----------------------------------- |
| `app/`                | `snake_case.ts`    | controllers, models, services, etc. |
| `inertia/components/` | `kebab-case.tsx`   |                                     |
| `inertia/pages/`      | `snake_case.tsx`   | matches routes                      |
| Jobs                  | `*_job.ts`         | **required** for auto-discovery     |
| Transformers          | `*_transformer.ts` |                                     |
| Tests                 | `*.spec.ts`        |                                     |

## Imports

**Backend**: Use subpath imports (`#models/*`, `#services/*`, `#validators/*`, etc.)  
**Frontend**: Use `@/*` for components/lib, `~/generated/*` for types  
**Relative**: Only for same-directory siblings

## Key Patterns

### Transformers (Required for all models)

```typescript
// Extends BaseTransformer<Model>, types auto-generate to .adonisjs/client/data.d.ts
export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, ['id', 'name'])
  }
  toWithRelations() {
    return {
      ...this.toObject(),
      posts: PostTransformer.transform(this.whenLoaded(this.resource.posts)),
    }
  }
}

// ✅ UserTransformer.transform(users)  — handles arrays automatically
// ❌ users.map(u => UserTransformer.transform(u))  — never manually map
```

Types available as `Data.User` from `~/generated/data`. Dev server must be running to generate.

### Actions vs Services

- **Action** = business logic, one `execute()` method (e.g., `RegisterUserAction`)
- **Service** = external system wrapper (e.g., `StripeService`, `S3Service`)

### Jobs (BullMQ)

```typescript
// Must end with _job.ts
export default class SendEmailJob extends Job<EmailData, Result> {
  static options: BullJobsOptions = { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
  async process(): Promise<Result> {
    /* ... */
  }
}
// Dispatch: await SendEmailJob.dispatch(data).with('delay', 1000)
```

### Type-Safe Routing (Tuyau)

```typescript
import { urlFor } from '@/client'
urlFor('campaigns.index', { organization: org.uuid })
router.post(urlFor('campaigns.store', { organization: org.uuid }), formData)
```

### Multi-Tenancy

Always filter by organization:

```typescript
async index(ctx: HttpContext & { organization: Organization }) {
  const campaigns = await Campaign.query().where('organization_id', ctx.organization.id)
}
```

### Permission Gates (Frontend)

```tsx
;<PermissionGate permission={Permission.PRODUCT_CREATE}>
  <Button>Create</Button>
</PermissionGate>
const canEdit = useCan(Permission.PRODUCT_UPDATE)
```

### Error Handling

```typescript
try {
  /* ... */ ctx.toast('success', 'Done')
} catch (error) {
  logger.error({ err: error }, 'Failed')
  ctx.toast('error', 'Failed')
}
```

### JSON Columns

```typescript
@column({ prepare: jsonColumn.prepare, consume: jsonColumn.consume })
declare metadata: Record<string, any>
```

## Rules

- **Never use `any`** — let TypeScript infer
- **Use `type`, never `interface`** for Inertia props
- **Use `type`, never `interface`** for return types when not using transformers (actions, services, etc.)
- **Avoid type assertions** (`as`, `!`) unless absolutely necessary
- **Avoid `unknown` in Inertia page props** — use concrete types (e.g., `Record<string, string>` instead of `Record<string, unknown>`). Complex or recursive types with `unknown` can cause Inertia's `ExtractProps` to resolve to `never`, breaking controller type-checking.
- Dev server always running — don't start it
- Jobs must end with `_job.ts`
