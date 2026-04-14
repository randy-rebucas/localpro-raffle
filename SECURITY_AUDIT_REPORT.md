# Security & Code Quality Audit Report
## LocalPro Raffle Application
**Date:** April 14, 2026  
**Severity Levels:** Critical | High | Medium | Low

---

## CRITICAL ISSUES

### 1. Missing Authorization Checks - Raffle Access Control
**Severity:** CRITICAL  
**Affected Files:**
- [app/api/raffles/[id]/route.ts](app/api/raffles/[id]/route.ts#L13-L50) - GET, PUT, DELETE endpoints
- [app/api/raffles/[id]/draw/route.ts](app/api/raffles/[id]/draw/route.ts#L1-L100) - POST draw endpoint
- [app/api/raffles/[id]/tiers/route.ts](app/api/raffles/[id]/tiers/route.ts#L1-L80) - POST, PUT, DELETE tier endpoints
- [app/api/raffles/[id]/participants/route.ts](app/api/raffles/[id]/participants/route.ts#L1-L80) - POST, GET participants
- [app/api/raffles/[id]/winners/route.ts](app/api/raffles/[id]/winners/route.ts#L1-L60) - GET winners endpoint
- [app/api/raffles/[id]/export/route.ts](app/api/raffles/[id]/export/route.ts#L1-L70) - GET export endpoint

**Issue:** These endpoints do NOT verify that the requesting user owns the raffle. Any authenticated user can:
- View, modify, or delete any raffle
- Add/remove participants from any raffle
- Execute draws on any raffle
- View winners and export winner data
- Modify tiers on any raffle

**Risk:** Complete data breach, unauthorized raffle manipulation, participant data exposure

**Recommendation:** 
```typescript
// Add ownership verification to all raffle-specific endpoints
const userId = await getCurrentUserIdFromRequest(request);
const raffle = await prisma.raffle.findUnique({ where: { id } });

if (!raffle || raffle.createdBy !== userId) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 403 }
  );
}
```

---

### 2. Weak Share Key Generation
**Severity:** CRITICAL  
**File:** [app/api/raffles/[id]/share/route.ts](app/api/raffles/[id]/share/route.ts#L18-L25)

**Issue:** Share keys use predictable generation:
```typescript
shareKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```
- Timestamp portion is known/guessable
- Random portion is low-entropy
- Not cryptographically secure

**Risk:** Attackers can enumerate and access private raffle results

**Recommendation:**
```typescript
import { randomBytes } from 'crypto';
shareKey: randomBytes(32).toString('hex')
```

---

### 3. Missing Authentication on Public Share Endpoint
**Severity:** CRITICAL (Partial)  
**File:** [app/api/raffles/share/[key]/route.ts](app/api/raffles/share/[key]/route.ts#L1-L80)

**Issue:** While this endpoint is intentionally public, it has NO rate limiting or abuse protection

**Risk:** 
- Brute force attacks on share keys
- Denial of service
- Enumeration of all public shares

**Recommendation:** Implement rate limiting (max 100 requests per IP per hour)

---

### 4. Unvalidated Sensitive Information in Error Messages
**Severity:** CRITICAL  
**File:** [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts#L29-L50)

**Issue:** Authentication errors reveal whether user exists:
```typescript
if (!user) {
  throw new Error("User not found");  // ← Leaks user existence
}
if (!isPasswordValid) {
  throw new Error("Invalid password");  // ← Confirms user exists
}
```

**Risk:** Email enumeration attacks, targeted account targeting

**Recommendation:**
```typescript
throw new Error("Invalid email or password");  // Generic message
```

---

## HIGH SEVERITY ISSUES

### 5. Unvalidated JSON Parsing in Templates
**Severity:** HIGH  
**Files:**
- [app/api/templates/route.ts](app/api/templates/route.ts#L44-L70) - POST create
- [app/api/templates/[id]/route.ts](app/api/templates/[id]/route.ts#L65-L100) - PUT update

**Issue:** Template tiers stored as JSON strings with no schema validation:
```typescript
tiers: JSON.stringify(tiers)  // No validation that structure is correct
```

Later retrieved and parsed without error handling:
```typescript
tiers: JSON.parse(template.tiers)  // Could fail or expose malformed data
```

**Risk:** 
- Type confusion
- Runtime errors
- Data integrity issues

**Recommendation:** Use Zod or similar for schema validation:
```typescript
const tierSchema = z.array(z.object({
  prizeName: z.string().min(1),
  prizeAmount: z.number().min(0),
  winnerCount: z.number().min(1).int()
}));

const validated = tierSchema.parse(body.tiers);
```

---

### 6. Missing Environment Variable Validation at Startup
**Severity:** HIGH  
**Files:**
- [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts#L82) - `NEXTAUTH_SECRET`
- [lib/email.ts](lib/email.ts#L1-L20) - `RESEND_API_KEY`
- [app/api/raffles/[id]/send-emails/route.ts](app/api/raffles/[id]/send-emails/route.ts#L55) - `NEXTAUTH_URL`

**Issue:** 
- `NEXTAUTH_SECRET` could be undefined in production, silently failing
- `RESEND_API_KEY` is warn-only, but endpoint might still work partially
- `NEXTAUTH_URL` has fallback to localhost in production

**Risk:** 
- Secret compromise
- Production runtime failures
- Email not actually sending without clear error

**Recommendation:** Validate at application startup:
```typescript
const requiredEnvVars = ['NEXTAUTH_SECRET', 'RESEND_API_KEY', 'NEXTAUTH_URL'];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}
```

---

### 7. Unsafe Type Assertions Throughout
**Severity:** HIGH  
**Files:**
- [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts#L73) - `(user as any)`
- [app/api/raffles/[id]/draw/route.ts](app/api/raffles/[id]/draw/route.ts#L50-L70) - Multiple `(p: any)`, `(t: any)` casts

**Issue:** Widespread use of `any` type bypasses TypeScript safety:
```typescript
return { id: (user as any).id };
participants: raffle.participants.map((p: any) => ...)
```

**Risk:** 
- Type confusion vulnerabilities
- Runtime errors
- Difficult to audit code safety

**Recommendation:** Use proper typing:
```typescript
interface User {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
}

const user: User = await prisma.user.findUnique(...);
```

---

### 8. CSV Injection Vulnerability
**Severity:** HIGH  
**Files:**
- [app/api/raffles/[id]/export/route.ts](app/api/raffles/[id]/export/route.ts#L30-L55)
- [utils/csv.ts](utils/csv.ts#L50-L75)

**Issue:** CSV export does NOT escape cells that start with formula characters:
```typescript
csvRows.push(
  'Raffle ID,Raffle Title,...',
);
raffle.winners.forEach((winner: any) => {
  const row = [
    raffle.id,
    ...
    `"${winner.tier.prizeName.replace(/"/g, '""')}"`,  // Only escapes quotes
```

If a prize name starts with `=`, `+`, `@`, `−`, the CSV can execute formulas in Excel.

**Risk:** Remote code execution when winner data is opened in spreadsheet applications

**Recommendation:**
```typescript
function escapeCsvCell(value: string): string {
  // Force string interpretation by prefixing with single quote
  if (/^[=+@−]/.test(value)) {
    return `'${value}`;
  }
  return `"${value.replace(/"/g, '""')}"`;
}
```

---

### 9. Weak Session Timeout
**Severity:** HIGH  
**File:** [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts#L80)

**Issue:** Session maxAge is 30 days:
```typescript
maxAge: 30 * 24 * 60 * 60, // 30 days
```

**Risk:** 
- Long-lived sessions increase compromise exposure window
- Stolen tokens have extended validity
- No re-authentication for sensitive operations

**Recommendation:** Reduce to 7 days or less:
```typescript
maxAge: 7 * 24 * 60 * 60, // 7 days
```

---

### 10. Missing Input Validation - Draw Winner Count
**Severity:** HIGH  
**File:** [app/api/raffles/[id]/draw/route.ts](app/api/raffles/[id]/draw/route.ts#L25-L45)

**Issue:** No validation that actual participant count ≥ total winners needed:
```typescript
if (raffle.participants.length === 0) {
  return NextResponse.json({ error: 'No participants...' }, { status: 400 });
}
// BUT: Could still exceed participants if tiers are misconfigured
```

This check happens in `drawWinners()` utility but fails silently in DB transaction if called twice.

**Risk:** Race conditions leading to invalid draw state

**Recommendation:** Validate before starting transaction, lock raffle row

---

### 11. No CORS/Security Headers Configuration
**Severity:** HIGH  
**File:** [next.config.ts](next.config.ts) - Empty configuration

**Issue:** No security headers configured:
- No `Content-Security-Policy`
- No `X-Frame-Options`
- No `X-Content-Type-Options`
- No `Strict-Transport-Security`
- No CORS restrictions

**Risk:** 
- Clickjacking attacks
- MIME type sniffing
- Cross-origin data leaks
- Man-in-the-middle attacks

**Recommendation:** Add to `next.config.ts`:
```typescript
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'"
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }
];
```

---

### 12. Incomplete Ownership Check in Send Emails
**Severity:** HIGH  
**File:** [app/api/raffles/[id]/send-emails/route.ts](app/api/raffles/[id]/send-emails/route.ts#L46-L60)

**Issue:** While ownership is checked, the `raffleUrl` has a bug:
```typescript
raffleUrl: `${process.env.NEXTAUTH_URL}/share/${raffle.id}`, // TODO: Get actual share key
```

Uses raffle ID instead of share key - results in 404 or 403 errors for share link.

**Risk:** Share links won't work in winner emails

**Recommendation:**
```typescript
const share = await prisma.raffleShare.findFirst({
  where: { raffleId: id }
});
raffleUrl: share ? `${process.env.NEXTAUTH_URL}/share/${share.shareKey}` : undefined
```

---

## MEDIUM SEVERITY ISSUES

### 13. Insufficient Input Validation on Participants
**Severity:** MEDIUM  
**File:** [app/api/raffles/[id]/participants/route.ts](app/api/raffles/[id]/participants/route.ts#L1-L40)

**Issue:** 
- Email validation is minimal (only NULL check)
- Name length not limited
- No SQL injection protection (Prisma handles this but not explicit validation)
- No duplicate deduplication across multiple inserts

```typescript
if (!Array.isArray(participants) || participants.length === 0) {
  // OK
}
// No max array size check (could be 1 million items)
// No email format validation
```

**Risk:** 
- DoS via large participant lists
- Invalid data pollution
- Email enumeration attacks

**Recommendation:**
```typescript
const maxParticipants = 10000;
if (participants.length > maxParticipants) {
  return NextResponse.json(
    { error: `Maximum ${maxParticipants} participants per request` },
    { status: 400 }
  );
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (p.email && !emailRegex.test(p.email)) {
  return NextResponse.json(
    { error: 'Invalid email format' },
    { status: 400 }
  );
}

if (p.name.length > 255) {
  return NextResponse.json(
    { error: 'Name too long' },
    { status: 400 }
  );
}
```

---

### 14. Potential N+1 Query Patterns
**Severity:** MEDIUM  
**File:** [app/api/raffles/[id]/send-emails/route.ts](app/api/raffles/[id]/send-emails/route.ts#L50-L60)

**Issue:** Loop that could be optimized:
```typescript
for (const tierResult of drawResult) {
  for (const winner of tierResult.winners) {
    const winnerRecord = await prisma.winner.create({  // N queries for N winners
      ...
    });
  }
}
```

**Risk:** 
- Performance degradation with many winners
- Database connection exhaustion
- Timeout on large raffle draws

**Recommendation:** Use `createMany()`:
```typescript
const winnersToCreate = drawResult.flatMap(tier =>
  tier.winners.map(w => ({
    raffleId: id,
    tierId: tier.tierId,
    participantId: w.participantId,
  }))
);

await prisma.winner.createMany({ data: winnersToCreate });
```

---

### 15. Rate Limiting Not Implemented
**Severity:** MEDIUM  
**Affected Endpoints:**
- Login/signup (auth brute force)
- Email sending (spam)
- Participant upload (DoS)
- Draw execution (race conditions)

**Risk:** 
- Brute force attacks on authentication
- Denial of service
- Cost overruns on email service

**Recommendation:** Implement rate limiting middleware (e.g., `next-rate-limit` or `express-rate-limit` port)

---

### 16. Lack of Audit Logging
**Severity:** MEDIUM  
**Affected Operations:**
- Raffle creation/modification/deletion
- Draw execution
- Winner notifications
- Access to sensitive data

**Risk:** 
- No forensic trail after security events
- Cannot investigate unauthorized access
- Compliance violations

**Recommendation:** Add logging table to schema and log all state changes

---

### 17. Missing Decimal Validation
**Severity:** MEDIUM  
**File:** [prisma/schema.prisma](prisma/schema.prisma#L85-L95)

**Issue:** Prize amounts use Decimal without validation:
```prisma
prizeAmount   Decimal   @default(0)
```

No database constraint on precision or negative values.

**Risk:** 
- Negative prize amounts
- Extremely large numbers
- Data corruption

**Recommendation:**
```typescript
prizeAmount: z.number().min(0).max(999999999.99)
```

---

### 18. HTML Injection in Email Template
**Severity:** MEDIUM  
**File:** [lib/email.ts](lib/email.ts#L28-L72)

**Issue:** User-controlled data inserted into HTML template without escaping:
```typescript
<p>Dear <strong>${data.winnerName}</strong>,</p>
<p>...won the <strong>${data.prizeName}</strong> prize...</p>
```

If `winnerName` or `prizeName` contains HTML/script, it could execute.

**Risk:** 
- XSS in email clients (limited exposure)
- Phishing preparation
- Email system compromise

**Recommendation:** Use HTML entity encoding:
```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

<strong>${escapeHtml(data.winnerName)}</strong>
```

---

### 19. Middleware Not Verifying JWT Signature
**Severity:** MEDIUM  
**File:** [middleware.ts](middleware.ts#L1-L30)

**Issue:** Middleware only checks for cookie existence, not JWT validity:
```typescript
const hasSessionToken = 
  req.cookies.has('next-auth.session-token') ||
  req.cookies.has('__Secure-next-auth.session-token');

if (!hasSessionToken) {
  // Redirect to login
}
```

An attacker could set any cookie value and bypass middleware. However, API routes do proper verification.

**Risk:** 
- Middleware false sense of security
- Need to verify actual JWT in route handlers

**Recommendation:** Verify JWT in middleware:
```typescript
const token = await getToken({ req });
if (!token) {
  return NextResponse.redirect(new URL('/login', req.url));
}
```

---

### 20. Logging SQL Queries in Development
**Severity:** MEDIUM  
**File:** [lib/prisma.ts](lib/prisma.ts#L19-L22)

**Issue:** Query logging enabled in development could leak data:
```typescript
log:
  process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
```

Queries with sensitive data might be logged to console/files.

**Risk:** 
- Credential exposure
- Personal data in logs
- Compliance violations (GDPR, CCPA)

**Recommendation:** 
```typescript
log: ['error'],  // Remove query logging entirely
```

---

## LOW SEVERITY ISSUES

### 21. Missing API Versioning
**Severity:** LOW  
**File:** API routes use generic paths without version

**Issue:** No versioning for API endpoints (`/api/v1/`, `/api/v2/`)

**Risk:** Breaking changes affect all clients simultaneously

**Recommendation:** Use URL versioning: `/api/v1/raffles/...`

---

### 22. Inconsistent Error Response Format
**Severity:** LOW  
**Issue:** Error responses vary:
- Some: `{ error: 'message' }`
- Some: `{ success: false, error: '...' }`
- Some: Plain text errors

**Risk:** Client-side error handling complexity

**Recommendation:** Standardize all responses:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
```

---

### 23. Password Requirements Too Lenient
**Severity:** LOW  
**File:** [app/api/auth/signup/route.ts](app/api/auth/signup/route.ts#L16-L22)

**Issue:** Minimum 8 characters, no complexity requirements:
```typescript
if (password.length < 8) {
  return NextResponse.json(
    { error: 'Password must be at least 8 characters' },
    { status: 400 }
  );
}
```

**Risk:** Weak passwords still allowed

**Recommendation:** Enforce complexity:
```typescript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
if (!passwordRegex.test(password)) {
  return NextResponse.json(
    { error: 'Password must be at least 12 chars with uppercase, lowercase, number, and symbol' },
    { status: 400 }
  );
}
```

---

### 24. Default Database Path in Production
**Severity:** LOW  
**File:** [lib/prisma.ts](lib/prisma.ts#L12-L14)

**Issue:** SQLite file stored in project directory:
```typescript
const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
```

Better-sqlite3 is not designed for production multi-instance deployments.

**Risk:** 
- Data loss if running multiple instances
- Performance issues at scale
- File locking problems

**Recommendation:** Use PostgreSQL or MySQL for production

---

### 25. Missing Request Timeout Configuration
**Severity:** LOW  
**Issue:** No timeout for long-running operations (drawing large raffles, batch email sending)

**Risk:** Hung requests, resource exhaustion

**Recommendation:** Add timeout middleware and configure Next.js:
```typescript
export const maxDuration = 60; // seconds
```

---

### 26. No Input Size Limit Validation
**Severity:** LOW  
**Issue:** No explicit checks on request body size for bulk operations

**Risk:** Memory exhaustion via large requests

**Recommendation:** Configure in `next.config.ts`:
```typescript
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
```

---

### 27. Missing CSRF Protection
**Severity:** LOW  
**Issue:** No explicit CSRF token validation for state-changing POSTs

**Risk:** Cross-site request forgery (limited by SameSite by default in modern Next.js, but not explicit)

**Recommendation:** Implement CSRF middleware or verify `Referer` header

---

### 28. No API Documentation/OpenAPI
**Severity:** LOW  
**Issue:** No API documentation or OpenAPI spec

**Risk:** 
- Difficult to maintain API contracts
- Client bugs from undocumented behavior
- Harder to audit security

**Recommendation:** Generate OpenAPI spec with Swagger/OpenAPI library

---

## SUMMARY TABLE

| Severity | Count | Issues |
|----------|-------|--------|
| **CRITICAL** | 4 | Missing raffle authorization, weak share keys, public brute force, info leakage |
| **HIGH** | 8 | JSON validation, env vars, unsafe types, CSV injection, session timeout, input validation, CORS, email bugs |
| **MEDIUM** | 8 | Participant validation, N+1 queries, no rate limiting, audit logging, decimal validation, HTML injection, JWT verification, query logging |
| **LOW** | 8 | API versioning, response format, password strength, database choice, timeouts, size limits, CSRF, documentation |

**Total Issues Found: 28**

---

## PRIORITY ACTION ITEMS

1. **IMMEDIATE (Within 24 hours):**
   - Add ownership checks to all raffle endpoints
   - Fix weak share key generation
   - Add rate limiting to public endpoints
   - Fix error message information leakage

2. **URGENT (Within 1 week):**
   - Implement Zod validation for all inputs
   - Add security headers
   - Fix CSV injection
   - Validate environment variables
   - Remove unsafe `any` types

3. **IMPORTANT (Within 2 weeks):**
   - Implement audit logging
   - Add input validation for all endpoints
   - Optimize N+1 queries
   - Add API rate limiting

4. **SHOULD DO (Within month):**
   - Implement API versioning
   - Standardize error responses
   - Add API documentation
   - Consider production database migration

---

## TESTING RECOMMENDATIONS

1. **Security Testing:**
   - Unauthorized access attempts across all endpoints
   - Share key guess/brute force attacks
   - Email enumeration via signup
   - CORS misconfiguration

2. **Input Validation Testing:**
   - Large participant list uploads
   - Special characters in participant names
   - Invalid email formats
   - Mixed tier configurations

3. **Performance Testing:**
   - Large raffle draws (10,000+ participants)
   - Batch email sending
   - Query performance monitoring

4. **Functional Testing:**
   - Raffle lifecycle (create → draw → email → export)
   - Template management
   - Share link generation and access
