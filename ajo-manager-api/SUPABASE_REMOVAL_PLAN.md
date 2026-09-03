# Supabase Complete Removal Plan

## Overview
This document outlines the 4-phase migration from Supabase to fully custom authentication and database layer.

**Timeline**: ~30 hours over 4 days  
**Complexity**: High  
**Risk Level**: Medium (requires data migration)

---

## Phase 1: Infrastructure Setup (8 hours)

### 1.1 Install Dependencies
```bash
npm install typeorm pg reflect-metadata
npm install bcrypt jsonwebtoken twilio
npm install --save-dev @types/bcrypt @types/jsonwebtoken
```

### 1.2 TypeORM Configuration
- Create `src/database/typeorm.config.ts`
- Set up PostgreSQL connection
- Configure migrations directory
- Add env variables (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME)

### 1.3 Create Core Services

#### JWT Service (`src/auth/jwt.service.ts`)
```typescript
- generateAccessToken(userId, phone, role)
- generateRefreshToken(userId)
- verifyAccessToken(token)
- verifyRefreshToken(token)
```

#### Password Service (`src/auth/password.service.ts`)
```typescript
- hashPassword(password)
- comparePassword(plain, hashed)
```

#### OTP Service (`src/auth/otp.service.ts`)
```typescript
- generateOtp(phone)
- sendOtp(phone) - via Twilio
- verifyOtp(phone, otp)
- storeOtp(phone, otp, expiresAt)
```

### 1.4 Create Entities
- `User` entity (id, phone, password_hash, email, name, role, created_at, updated_at)
- `RefreshToken` entity (id, userId, token, expiresAt, created_at)
- `OtpLog` entity (id, phone, otp, expiresAt, verified_at)

### 1.5 Create Migrations
- `0001_create_users_table.sql`
- `0002_create_refresh_tokens_table.sql`
- `0003_create_otp_logs_table.sql`

---

## Phase 2: Auth Module Rewrite (8 hours)

### 2.1 Rewrite Auth Service (`src/auth/auth.service.ts`)

#### Methods to implement:
```typescript
signUpWithPhone(phone: string, password: string)
  → Create user → Generate tokens → Return tokens + user

loginWithPhone(phone: string, password: string)
  → Find user → Compare password → Generate tokens

refreshAccessToken(refreshToken: string)
  → Verify refresh → Generate new access token

requestPhoneVerification(phone: string)
  → Generate OTP → Send via Twilio → Store OTP

verifyPhoneOtp(phone: string, otp: string)
  → Verify OTP → Update user verified_at

resetPassword(phone: string, newPassword: string)
  → Find user → Hash password → Update

getProfile(userId: string)
  → Fetch user details + related data (profile, subscription, etc)
```

### 2.2 Create Auth Guards (`src/auth/jwt.guard.ts`)
```typescript
- JwtGuard: Validates JWT in Authorization header
- RolesGuard: Checks user role (admin, user)
- AuthGuard: Combines both
```

### 2.3 Create Decorators (`src/common/decorators/`)
```typescript
@CurrentUser() → Extracts user from JWT
@Roles(...roles) → Role-based access
@IsAdmin() → Admin-only shorthand
```

### 2.4 Create Auth Controller (`src/auth/auth.controller.ts`)

#### Endpoints:
```
POST /auth/signup - Phone + Password signup
POST /auth/login - Phone + Password login
POST /auth/verify-otp - Phone verification
POST /auth/refresh - Token refresh
POST /auth/reset-password - Password reset
GET /auth/profile - Get current user
POST /auth/logout - Revoke refresh token
```

### 2.5 Update App Module
- Import TypeOrmModule
- Register all entities
- Configure database connection
- Set up auth middleware

---

## Phase 3: Database Migration (10 hours)

### 3.1 Rewrite All Repos (16 files)

**Target files:**
```
src/groups/groups.repo.ts
src/members/members.repo.ts
src/contributions/contributions.repo.ts
src/payouts/payouts.repo.ts
src/subscriptions/subscriptions.repo.ts
src/admin/admin.repo.ts
src/audit/audit.repo.ts
src/reminders/reminders.repo.ts
src/public/public.repo.ts
src/webhook/webhook.repo.ts
src/auth/auth.repo.ts
+ others
```

**Example transformation:**
```typescript
// OLD (Supabase)
async getGroupById(groupId: string) {
  const { data } = await this.supabase
    .getAdminClient()
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()
  return data
}

// NEW (TypeORM)
async getGroupById(groupId: string) {
  return await this.groupsRepository.findOne({
    where: { id: groupId },
    relations: ['members', 'contributions']
  })
}
```

### 3.2 Replace All Supabase Injections
- Search: `private supabase: SupabaseService`
- Replace with: `private repository: Repository<Entity>`
- Update constructor injections

### 3.3 Update Services
- Remove Supabase.getAdminClient() calls
- Use TypeORM repositories
- Keep business logic intact

### 3.4 Migrate Data
```bash
# Export from Supabase
pg_dump -h supabase-host -U supabase-user -d database > backup.sql

# Import to custom PostgreSQL
psql -U postgres -d ajopot < backup.sql

# Verify data integrity
npm run verify-migration
```

---

## Phase 4: Frontend Integration (4 hours)

### 4.1 Create Auth API Client (`src/lib/authApi.ts`)
```typescript
- signUp(phone, password)
- login(phone, password)
- logout()
- refreshToken()
- getProfile()
```

### 4.2 Update Auth Store (`src/stores/authStore.ts`)
```typescript
- Replace Supabase auth with custom API calls
- Store JWT in localStorage
- Handle token refresh automatically
- Add error handling
```

### 4.3 Update Auth Pages
- LoginPage.tsx → Use authApi instead of supabase
- SignUpPage.tsx → Use authApi
- ProfilePage.tsx → Use authApi for profile fetch

### 4.4 Update API Interceptor
- Add JWT to Authorization header
- Implement token refresh logic
- Handle 401 responses

### 4.5 Remove Supabase Client
- Delete `src/lib/supabase.ts`
- Remove supabase dependencies from package.json
- Clean up imports

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  phone_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### OTP Logs Table
```sql
CREATE TABLE otp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Env Variables to Add

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=ajopot

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=2592000

# OTP
OTP_EXPIRATION=600
OTP_LENGTH=6

# Twilio (for OTP)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Node
NODE_ENV=development
```

---

## Migration Checklist

- [ ] Phase 1: Infrastructure
  - [ ] TypeORM installed and configured
  - [ ] JWT, Password, OTP services created
  - [ ] User entities and migrations created
  - [ ] Database connection working

- [ ] Phase 2: Auth Module
  - [ ] Auth service rewritten
  - [ ] Auth guards and decorators created
  - [ ] Auth controller with endpoints
  - [ ] App module updated

- [ ] Phase 3: Database
  - [ ] All 16 repos migrated to TypeORM
  - [ ] All services updated
  - [ ] Supabase injections removed
  - [ ] Data successfully migrated

- [ ] Phase 4: Frontend
  - [ ] Auth API client created
  - [ ] Auth store updated
  - [ ] Pages updated to use new API
  - [ ] Supabase client removed

- [ ] Testing & Validation
  - [ ] Auth flow (signup/login) works
  - [ ] Token refresh works
  - [ ] All tests pass
  - [ ] Build succeeds
  - [ ] No TypeErrors

---

## Rollback Plan

If issues occur during migration:

1. **Keep Supabase backup** - Don't delete until 1 week in production
2. **Database backup** - Full pg_dump before migration
3. **Git branch** - Main branch untouched until verified
4. **Feature flags** - Old and new auth can coexist temporarily
5. **Gradual rollout** - Test with admins first

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Data loss | Full backup + validation script |
| Breaking changes | Comprehensive test coverage |
| User lockout | Parallel auth systems for 24h |
| Performance | Database indexing strategy |
| Security | JWT token rotation, rate limiting |

---

## Success Criteria

- ✅ All existing users can login with old phone/password
- ✅ New users can sign up with custom auth
- ✅ JWT tokens work for API requests
- ✅ Token refresh works automatically
- ✅ All tests pass (existing + new)
- ✅ Build completes with no errors
- ✅ Frontend can login/signup/logout
- ✅ No Supabase references in codebase
- ✅ Performance: API response time < 200ms
- ✅ Security: Password hashed, tokens signed
