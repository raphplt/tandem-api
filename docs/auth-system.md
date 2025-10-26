# Authentication System Overview

This API relies on **Better Auth** for credential handling and session management while persisting state with **NestJS**, **TypeORM**, and **PostgreSQL**. The integration keeps Better Auth as the source of truth for authentication events and mirrors key user data into the local `users` table for business logic.

## Core Building Blocks

- `AuthModule`
  - Imports TypeORM repositories for both Better Auth storage tables and local `User` entities.
  - Provides shared services and guards (`AuthService`, `BetterAuthService`, `AuthGuard`, `RolesGuard`, `OwnershipGuard`).
- `BetterAuthService`
  - Bootstraps the Better Auth instance using environment-driven config.
  - Wires the custom TypeORM adapter so Better Auth reads/writes through the same PostgreSQL connection as the app.
- `TypeORMAdapter`
  - Implements the Better Auth adapter contract with TypeORM repositories (`better_auth_user`, `better_auth_session`, `better_auth_account`).
  - Normalises "where" clauses coming from Better Auth and qualifies every SQL fragment with the proper table alias to avoid Postgres case-folding issues.
- `AuthService`
  - High-level façade used by controllers and guards.
  - Delegates login, registration, session retrieval, logout, and password change to Better Auth’s API surface.
  - Ensures a matching `User` row exists (creates or updates names/email/roles) so domain logic can rely on local data.
  - Tracks `lastLoginAt` / `lastLogoutAt` timestamps in the local table.
- `AuthController`
  - Thin HTTP layer exposing `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/profile`, `/auth/change-password`.
  - Each endpoint simply calls into `AuthService`, which handles Better Auth interaction and response shaping.
- Guards
  - `AuthGuard` checks for a valid Better Auth session, enriches the request with user details (id, email, names, roles).
  - `RolesGuard` and `OwnershipGuard` operate on that request context for role-based and ownership checks.

## Request Flow

1. **Registration**
   - `AuthController.register` → `AuthService.register` → `betterAuth.api.signUpEmail`.
   - On success, `ensureLocalUser` creates or syncs a `User` row and returns a standardised `AuthResponseDto`.
2. **Login**
   - `AuthController.login` → `AuthService.login` → `betterAuth.api.signInEmail`.
   - Updates `lastLoginAt` and returns the same response DTO.
3. **Authenticated calls**
   - `AuthGuard` validates the Better Auth session (`api.getSession`) and loads the local `User` to capture roles / names, then assigns `request.user`.
4. **Logout**
   - `AuthController.logout` → `AuthService.logout` → `betterAuth.api.signOut`, then records `lastLogoutAt` if a user context is present.
5. **Password change**
   - Delegates to `betterAuth.api.changePassword` and surfaces a simple success/error payload.

## Persistence Layout

Better Auth tables (managed via TypeORM entities):

- `better_auth_user`
- `better_auth_session`
- `better_auth_account`

Application table:

- `users` table keeps profile data, roles, and timestamps required by other services.

## Error Handling

- Registration conflicts throw `ConflictException` when Better Auth reports duplicates.
- Authentication failures always return `UnauthorizedException` to avoid leaking internal errors.
- Adapter queries are wrapped so missing columns or malformed filters bubble up as Nest HTTP exceptions.

## Testing

- `src/auth/auth.service.spec.ts` covers register/login/profile flows using mocked Better Auth adapters.
- Jest mocks the `better-auth` modules to avoid pulling ESM dependencies into the Jest runtime.

## Operational Notes

- Configuration (secrets, base URL, trusted origins) is provided by `ConfigService` (`jwt.secret`, `app.baseURL`, etc.).
- Changing session durations or password requirements should be done in `BetterAuthService` where Better Auth is initialised.
- When adding new auth-dependent endpoints, inject `AuthService` for business logic and apply `AuthGuard`/`RolesGuard` as needed.
