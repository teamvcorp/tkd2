# App Stack & Setup Guide

Reference for replicating the auth, registration, data storage, admin, and payment architecture used in this Next.js application.

---

## Tech Stack Overview

| Layer            | Technology                        |
| ---------------- | --------------------------------- |
| Framework        | Next.js 16 (App Router)          |
| React            | React 19                         |
| Auth             | NextAuth v5 (beta.30) + Credentials |
| Database         | MongoDB (driver v7.1)            |
| Payments         | Stripe (server SDK)              |
| Styling          | Tailwind CSS                     |
| Email            | Resend                           |
| Hosting          | Vercel                           |
| Image Storage    | Vercel Blob                      |

---

## Environment Variables

Create a `.env.local` with these keys:

```env
# NextAuth
AUTH_SECRET=<random-secret-for-jwt-signing>

# MongoDB
MONGO_DB_STORAGE_MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DATABASE=tkd

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin
ADMIN_PASSWORD=<your-admin-password>

# Email (Resend)
RESEND_API_KEY=re_...
```

---

## 1. User Authentication

### NextAuth Credentials Provider

**Files:** `auth.ts`, `app/api/auth/[...nextauth]/route.ts`

- Strategy: **JWT** (no database sessions)
- Provider: **Credentials** (username + password)
- Password hashing: **bcryptjs** with cost factor 12
- On sign-in: looks up user in MongoDB by username, verifies hash, returns user
- JWT callback stores `username` in the token
- Session callback injects `username` into the session object
- Default redirect after sign-in: `/members`

**Setup steps for a new app:**

1. `npm install next-auth@beta bcryptjs`
2. Create `auth.ts` at project root:
   ```ts
   import NextAuth from 'next-auth';
   import Credentials from 'next-auth/providers/credentials';
   import bcrypt from 'bcryptjs';
   // import your user lookup function

   export const { handlers, signIn, signOut, auth } = NextAuth({
     providers: [
       Credentials({
         credentials: {
           username: { label: 'Username', type: 'text' },
           password: { label: 'Password', type: 'password' },
         },
         async authorize(credentials) {
           const user = await getUserByUsername(credentials.username);
           if (!user) return null;
           const valid = await bcrypt.compare(credentials.password, user.passwordHash);
           return valid ? { id: user.id, name: user.username } : null;
         },
       }),
     ],
     session: { strategy: 'jwt' },
     callbacks: {
       async jwt({ token, user }) {
         if (user) token.username = user.name;
         return token;
       },
       async session({ session, token }) {
         session.user.username = token.username;
         return session;
       },
     },
     pages: { signIn: '/members' },
   });
   ```
3. Create the NextAuth route handler at `app/api/auth/[...nextauth]/route.ts`:
   ```ts
   import { handlers } from '@/auth';
   export const { GET, POST } = handlers;
   ```
4. Wrap your app in `<SessionProvider>` (client component in `app/providers.tsx`):
   ```tsx
   'use client';
   import { SessionProvider } from 'next-auth/react';
   export default function Providers({ children }) {
     return <SessionProvider>{children}</SessionProvider>;
   }
   ```

---

## 2. User Registration

**File:** `app/api/register/route.ts`

### Flow

1. User submits: `username`, `password`, `parentName`, `parentAge`, optional `kids[]`
2. Server validates:
   - Username: >= 3 chars, alphanumeric + underscores, lowercased/trimmed, must be unique
   - Password: >= 8 chars
   - Parent name & age: required
3. Password hashed with `bcrypt.hash(password, 12)`
4. User document created with UUID `id`, timestamps, and inserted into MongoDB `users` collection
5. Kids default to `status: 'pending'`

### User Data Model

```ts
interface User {
  id: string;                     // crypto.randomUUID()
  username: string;               // unique, lowercase
  passwordHash: string;           // bcrypt hash
  parentName: string;
  parentAge: number;
  kids: Kid[];
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  purchases?: Purchase[];
  createdAt: string;              // ISO datetime
  updatedAt: string;              // ISO datetime
}

interface Kid {
  name: string;
  age: number;
  rank: string;
  program?: string;
  status?: 'pending' | 'active' | 'inactive';
  expiresAt?: string;             // ISO datetime, 12 months from payment
  stripePaymentIntentId?: string;
  avatarUrl?: string;
}

interface Purchase {
  id: string;                     // Stripe PaymentIntent ID
  productId: string;
  productName: string;
  category: string;
  size?: string;
  fulfillment: 'ship' | 'pickup';
  shippingAddress?: string;
  amount: number;                 // cents
  purchasedAt: string;
}
```

### Registration includes a multi-step wizard (on the members page):

| Step | Purpose |
|------|---------|
| 1    | Username + password + confirm |
| 2    | Parent name & age |
| 3    | Stripe payment method setup (SetupIntent) |
| 4    | Add students (kids) with name, age, rank, program |

---

## 3. MongoDB Data Storage

**File:** `lib/mongodb.ts`

### Connection Setup

```ts
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_DB_STORAGE_MONGODB_URI!;
const options = { maxIdleTimeMS: 5000 };

// Reuse client in dev to survive hot reloads
let client: MongoClient;
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri, options);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(uri, options);
}

export default client;
```

### Collections

| Collection | Purpose |
|------------|---------|
| `users`    | User accounts, kids, purchases |
| `products` | Pro Shop inventory |

### User Store Functions (`lib/userStore.ts`)

| Function | Description |
|----------|-------------|
| `getUserByUsername(username)` | Find user by lowercase username |
| `createUser(user)` | Insert new user document |
| `updateUser(user)` | Upsert (replace) user by `id` |

All username lookups normalize to lowercase and trim whitespace.

### Dependencies

```
npm install mongodb
```

---

## 4. Admin Dashboard

### Admin Authentication

**File:** `lib/adminAuth.ts`

Separate from user auth — uses a **shared password** verified via cookie.

- Login: POST to `/api/admin/auth` with `{ password }`
- Server hashes `admin:<password>:<AUTH_SECRET>` with SHA-256
- Compares against hash of `ADMIN_PASSWORD` env var
- Sets `admin_token` cookie (HttpOnly, Secure in prod, SameSite=lax, 8hr TTL)
- Logout: DELETE to `/api/admin/auth` clears the cookie

**Middleware helper:** `verifyAdmin(request)` reads the cookie and compares the token hash. Returns `true/false`. Used to gate all `/api/admin/*` routes.

### Admin API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/auth` | POST | Admin login |
| `/api/admin/auth` | DELETE | Admin logout |
| `/api/admin/users` | GET | List all users (no password hashes) |
| `/api/admin/users/[id]` | PATCH | Update user info & kids |
| `/api/admin/users/[id]/reset-password` | POST | Reset a user's password |
| `/api/admin/products` | GET | List all products |
| `/api/admin/products` | POST | Create product |
| `/api/admin/products/[id]` | PATCH | Update product |
| `/api/admin/products/[id]` | DELETE | Delete product |
| `/api/admin/stripe-check` | GET | Stripe config diagnostics |

### Admin Dashboard UI (`app/admin/page.tsx`)

- Password gate on the client side (calls `/api/admin/auth`)
- Two tabs: **Pro Shop** and **Users**
- **Pro Shop tab:** category sub-tabs, product cards with image upload, quantity tracking, in-stock toggle, Stripe ID fields, add/edit/delete
- **Users tab:** search by username/parent/kid name, expand to view/edit students, manage rank/program/status, reset passwords, view purchase history

---

## 5. Stripe Payment Integration

**File:** `lib/stripe.ts`

```ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export default stripe;
```

### Payment Flows

#### A. Registration — Save Payment Method

1. Client calls `POST /api/stripe/create-customer`
2. Server creates a Stripe Customer with parent metadata
3. Server creates a SetupIntent attached to that customer
4. Returns `customerId` + `clientSecret`
5. Client uses Stripe Elements to collect card → confirms SetupIntent
6. Payment method saved on customer for future charges

#### B. Enrollment — Annual Program Payment

1. Client calls `POST /api/stripe/enroll` with `{ username, kidIndex, programId }`
2. Server creates a PaymentIntent for the program's annual price
3. Metadata: `username`, `kidIndex`, `program`, `type: 'enrollment'`
4. Client confirms payment with Stripe Elements
5. Webhook fires on success → kid status set to `active`, `expiresAt` set 12 months out

#### C. Pro Shop — Product Purchase

1. Client calls `POST /api/stripe/shop-order`
2. Server creates PaymentIntent for product price
3. Webhook fires on success → purchase added to user record, admin notified via email

### Webhook Handler (`app/api/stripe/webhook/route.ts`)

- Verifies signature with `STRIPE_WEBHOOK_SECRET`
- Events handled:
  - `payment_intent.succeeded` — activates enrollment or records purchase
  - `payment_intent.payment_failed` — marks kid inactive

### Key Stripe Dependencies

```
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

---

## 6. Email Notifications

**File:** `lib/email.ts`

- Provider: **Resend** (`npm install resend`)
- Sends HTML-formatted order confirmation emails to the admin on pro shop purchases
- Includes: customer name, product details, size, fulfillment method, amount, Stripe reference

---

## 7. Project Setup (from scratch)

```bash
# 1. Create Next.js app
npx create-next-app@latest my-app --typescript --tailwind --app --eslint

# 2. Install dependencies
cd my-app
npm install next-auth@beta bcryptjs mongodb stripe @stripe/stripe-js @stripe/react-stripe-js resend
npm install -D @types/bcryptjs

# 3. Create .env.local with all variables listed above

# 4. Set up files:
#    auth.ts                          → NextAuth config
#    lib/mongodb.ts                   → MongoDB client
#    lib/userStore.ts                 → User CRUD helpers
#    lib/types.ts                     → User/Kid/Purchase interfaces
#    lib/adminAuth.ts                 → Admin cookie auth
#    lib/stripe.ts                    → Stripe client
#    lib/email.ts                     → Resend email helper
#    app/providers.tsx                → SessionProvider wrapper
#    app/api/auth/[...nextauth]/route.ts → NextAuth route
#    app/api/register/route.ts        → Registration endpoint
#    app/api/profile/route.ts         → Profile get/update
#    app/api/admin/auth/route.ts      → Admin login/logout
#    app/api/admin/users/route.ts     → Admin user management
#    app/api/admin/products/route.ts  → Admin product management
#    app/api/stripe/create-customer/route.ts → Stripe customer creation
#    app/api/stripe/enroll/route.ts   → Enrollment payment
#    app/api/stripe/webhook/route.ts  → Stripe webhook handler
#    app/api/settings/payment/route.ts → Payment method updates

# 5. Set up Stripe webhook (for local dev)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 6. Run
npm run dev
```

---

## 8. Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| JWT sessions (no DB sessions) | Simpler, stateless, no session table needed |
| Credentials provider only | No OAuth needed for this use case |
| Separate admin auth (cookie + shared password) | Lightweight, no admin user model required |
| bcrypt cost 12 | Good security/speed balance |
| MongoDB driver (no Mongoose) | Lighter weight, full control, no schema overhead |
| Stripe SetupIntent for registration | Save card first, charge later per enrollment |
| Per-kid enrollment payments | Each student has their own payment + expiry |
| 12-month auto-expiry on kids | Webhook sets `expiresAt`, profile endpoint checks it |
| Vercel Blob for product images | Simple, integrated with Vercel hosting |

---

## 9. Folder Structure (relevant files)

```
├── auth.ts                        # NextAuth configuration
├── lib/
│   ├── mongodb.ts                 # MongoDB client singleton
│   ├── userStore.ts               # User CRUD operations
│   ├── types.ts                   # TypeScript interfaces
│   ├── adminAuth.ts               # Admin auth helpers
│   ├── stripe.ts                  # Stripe client
│   ├── email.ts                   # Resend email service
│   ├── programs.ts                # Enrollment programs & pricing
│   ├── shop.ts                    # Product CRUD operations
│   └── shop-types.ts              # Product type definitions
├── app/
│   ├── providers.tsx              # SessionProvider wrapper
│   ├── layout.tsx                 # Root layout
│   ├── members/page.tsx           # Registration wizard + member dashboard
│   ├── admin/page.tsx             # Admin dashboard
│   └── api/
│       ├── auth/[...nextauth]/    # NextAuth handlers
│       ├── register/              # User registration
│       ├── profile/               # Profile get/patch
│       ├── admin/
│       │   ├── auth/              # Admin login/logout
│       │   ├── users/             # User management
│       │   ├── products/          # Product management
│       │   └── stripe-check/      # Stripe diagnostics
│       ├── stripe/
│       │   ├── create-customer/   # Create Stripe customer
│       │   ├── enroll/            # Enrollment payment
│       │   ├── shop-order/        # Shop purchase payment
│       │   └── webhook/           # Stripe webhook handler
│       └── settings/payment/      # Payment method updates
```
