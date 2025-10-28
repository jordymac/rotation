# Clerk Authentication Removal Plan

**Date**: 2025-10-28
**Session**: CLERK-REMOVAL-2025-10-28-002
**Status**: Analysis Complete, Awaiting User Decision

## Executive Summary

Clerk authentication has been disabled in the codebase (imports commented out, bypassed in API routes), but not fully removed. This document outlines all Clerk references and provides a plan for complete removal.

## Critical Decision Required: Authentication Strategy

Before proceeding with Clerk removal, you must decide on authentication:

### Option 1: No Authentication (Current State)
- **Pros**: Simple, fast development, no auth overhead
- **Cons**: No user-specific features, admin routes unprotected
- **Use Case**: Public discovery tool, demo/MVP phase
- **Action**: Remove all Clerk code, simplify RLS to service-role only

### Option 2: Implement Custom Authentication
- **Pros**: Full control, no third-party dependencies
- **Cons**: Security responsibility, more development time
- **Use Case**: Specific auth requirements
- **Action**: Build JWT-based auth, update RLS policies

### Option 3: Switch to Supabase Auth
- **Pros**: Already using Supabase, integrated RLS, battle-tested
- **Cons**: Another third-party service, learning curve
- **Use Case**: Need user auth with minimal overhead
- **Action**: Implement Supabase Auth, update RLS policies

### Option 4: Keep Clerk (Re-enable)
- **Pros**: Already configured, full-featured
- **Cons**: Cost, overkill for simple use case
- **Use Case**: Enterprise features needed
- **Action**: Uncomment code, fix broken references

## Clerk References Inventory

### 1. Active Code Files

#### Files with Clerk Imports (Active but Bypassed)

**`src/app/api/admin/stores/route.ts`**
- Line 2: `import { auth } from '@clerk/nextjs/server'`
- Lines 6-11: GET auth check commented out
- Lines 20-25: POST auth check commented out
- **Action**: Remove import, clean up comments

**`src/app/api/user/collection/route.ts`**
- **Status**: Needs review for Clerk imports
- **Action**: Check and remove if present

**`src/app/api/admin/stores/[id]/route.ts`**
- **Status**: Needs review for Clerk imports
- **Action**: Check and remove if present

**`src/app/api/user/discogs-username/route.ts`**
- **Status**: Needs review for Clerk imports
- **Action**: Check and remove if present

#### Files with Commented Clerk Code

**`src/middleware.ts`**
```typescript
// Lines 1-10: Commented Clerk middleware
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
```
- Currently: Simple passthrough middleware
- **Action**: Clean up comments, keep simple middleware

**`src/app/layout.tsx`**
```typescript
// Line 4: Commented ClerkProvider import
// import { ClerkProvider } from '@clerk/nextjs';
```
- **Action**: Remove commented import

**`src/app/profile/page.tsx`**
```typescript
// Line 3: Commented useUser import
// import { useUser } from '@clerk/nextjs';
// Line 10-11: User set to null
const user = null; // Temporarily disabled
```
- Line 85: References `user.primaryEmailAddress` (will fail if accessed)
- **Status**: Page is broken, returns "Loading..." forever
- **Action**: Remove page entirely OR refactor without auth

### 2. Dependencies

**`package.json`**
```json
"@clerk/nextjs": "^6.26.0"
```
- **Size**: ~2-3MB with dependencies
- **Action**: Remove from dependencies object

**`package-lock.json`**
- Contains full Clerk dependency tree
- **Action**: Auto-updates when package.json is changed

### 3. Environment Variables

**`.env.local`**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dXNlZnVsLW1hcnRlbi00Ni5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_BhUGhAm9IpskBV0sS0SjwxM00o7XqlBqyr8dfCTLbc
```
- **Action**: Can be removed (or keep commented for reference)

### 4. Documentation

**`CLAUDE.md`**
- ✅ Line 175-178: Updated to reflect no auth
- ✅ Line 204-206: Removed Clerk from External APIs
- ✅ Lines 236-240: Removed Clerk auth keys section

**`docs/workflows/database-schema.md`**
- Line 460: "Logged-in users via Clerk authentication"
- Lines 462, 476, etc.: References to Clerk throughout Security section
- **Action**: Update to reflect current auth state

**`docs/security/RLS_POLICY_DOCUMENTATION.md`**
- Multiple references to Clerk authentication
- Examples using `auth.uid()`
- **Action**: Update to reflect service-role only model

**`docs/security/SECURITY_AUDIT_LOG.md`**
- No Clerk references (recently created)
- **Action**: Add entry documenting Clerk removal

### 5. RLS Policies (CRITICAL)

**Migration 013**: `migrations/013_enable_rls.sql`

The RLS policies created yesterday assume Clerk authentication and use `auth.uid()`:

**Policies Affected** (~20 policies):
```sql
-- Users can read own data
USING (id = auth.uid()::text OR id::uuid = auth.uid())

-- Store managers can read own assignments
USING (user_id::uuid = auth.uid())

-- Users can manage own favorites
USING (user_id::uuid = auth.uid())

-- Users can manage own collections
USING (user_id::uuid = auth.uid())

-- And many more...
```

**Problem**: `auth.uid()` is a Supabase function that reads from JWT tokens. Without authentication provider, these policies will:
1. Always return NULL
2. Block all authenticated user access
3. Only service role will work

**Impact**:
- ✅ Service role access still works (Next.js API routes)
- ❌ User-specific policies don't work (but you may not need them)
- ❌ Public read policies still work

## Removal Checklist

### Phase 1: Code Cleanup (Safe)

- [ ] Remove Clerk imports from all files:
  - [ ] `src/app/api/admin/stores/route.ts`
  - [ ] `src/app/api/user/collection/route.ts`
  - [ ] `src/app/api/admin/stores/[id]/route.ts`
  - [ ] `src/app/api/user/discogs-username/route.ts`

- [ ] Clean up commented Clerk code:
  - [ ] `src/middleware.ts` - Remove comments
  - [ ] `src/app/layout.tsx` - Remove comment

- [ ] Handle `/profile` page:
  - Option A: Delete entire page and route
  - Option B: Refactor to work without auth
  - **Recommendation**: Delete (currently broken)

- [ ] Remove Clerk from `package.json`
  ```bash
  npm uninstall @clerk/nextjs
  ```

### Phase 2: RLS Policy Update (Critical)

**Option A**: Service Role Only (Simplest)
- Create `migrations/015_simplify_rls_no_auth.sql`
- Drop all user-specific policies
- Keep only service role and public read policies
- Update documentation

**Option B**: Implement New Auth System
- Choose auth provider (Supabase Auth, custom, etc.)
- Update RLS policies to use new auth
- Create migration with new policies
- Update all API routes

**Option C**: Remove RLS Entirely (Not Recommended)
- Disable RLS on all tables
- Rely only on API route protection
- Higher security risk

### Phase 3: Documentation Update

- [ ] Update `docs/workflows/database-schema.md`
  - [ ] Remove Clerk references from Security section
  - [ ] Update authentication model description
  - [ ] Document current auth state

- [ ] Update `docs/security/RLS_POLICY_DOCUMENTATION.md`
  - [ ] Remove `auth.uid()` examples
  - [ ] Update to service-role only model
  - [ ] Add note about no user authentication

- [ ] Update `docs/security/SECURITY_AUDIT_LOG.md`
  - [ ] Add entry for Clerk removal
  - [ ] Document RLS policy changes
  - [ ] Note security implications

- [ ] Update `ACTIVITY.md`
  - [ ] Complete session CLERK-REMOVAL-2025-10-28-002
  - [ ] Mark all changes and files affected

### Phase 4: Testing

- [ ] Test admin routes work without Clerk
- [ ] Verify service role access to database
- [ ] Test public read access to stores/releases
- [ ] Confirm app builds successfully
- [ ] Check for any remaining Clerk errors in console

## Recommended Approach

Based on your current setup, I recommend **Option A: Service Role Only**:

### Why Service Role Only?
1. **Current State**: Already bypassing Clerk in all routes
2. **Simplicity**: No auth overhead, faster development
3. **Security**: Still protected by RLS service role policies
4. **Use Case**: Store management MVP doesn't require user accounts
5. **Future**: Can add auth later when needed for user features

### What This Means
- ✅ Next.js API routes have full database access (service role)
- ✅ Public can browse stores, releases, verified audio matches
- ❌ No user-specific features (favorites, collections)
- ❌ No admin protection (anyone can access admin routes)

### Security Considerations
- **Admin routes**: Consider IP-based access control or API keys
- **Service role key**: Must NEVER be exposed client-side
- **Rate limiting**: Implement to prevent API abuse
- **Future auth**: Easy to add later when needed

## Files to Create

### 1. Migration 015: Simplify RLS for No Auth
**`migrations/015_simplify_rls_no_auth.sql`**

Drop user-specific policies:
```sql
-- Drop policies that require auth.uid()
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Store managers can read own assignments" ON store_managers;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
-- ... and 15+ more

-- Keep service role and public policies
-- (Already exist, no changes needed)
```

### 2. Documentation Updates
- Update database-schema.md Security section
- Update RLS_POLICY_DOCUMENTATION.md
- Add entry to SECURITY_AUDIT_LOG.md
- Complete ACTIVITY.md session

## Questions for User

Before proceeding, please answer:

1. **Do you need user authentication at all?**
   - [ ] No - Public app, no user accounts
   - [ ] Yes - Need user features (favorites, collections)
   - [ ] Later - Not now, but eventually

2. **If yes, which auth system?**
   - [ ] Supabase Auth (recommended if using Supabase)
   - [ ] Custom JWT auth
   - [ ] Another provider (NextAuth, Auth0, etc.)
   - [ ] Undecided

3. **What about admin route protection?**
   - [ ] Not needed - Internal tool only
   - [ ] IP whitelist
   - [ ] API key/secret
   - [ ] Later

4. **User-specific features** (favorites, collections, play history)?
   - [ ] Remove entirely - Don't need them
   - [ ] Keep tables but disable features
   - [ ] Need to work - Will implement auth

## Next Steps

**Awaiting your decision on questions above.**

Once decided:
1. I'll remove all Clerk code
2. Create appropriate RLS migration
3. Update all documentation
4. Test and verify
5. Update ACTIVITY.md with results

## Related Sessions

- **SEC-AUDIT-2025-10-28-001**: Security audit and RLS implementation
- **CLERK-REMOVAL-2025-10-28-002**: This session (in progress)

---

**Status**: ⏳ Awaiting user decision on authentication strategy
**Last Updated**: 2025-10-28
