# Orchard Ops

Engagement tracker for Orchard Talent Group. Built with Next.js 14, PostgreSQL, Prisma, and NextAuth.

---

## Stack

- **Next.js 14** (App Router)
- **PostgreSQL** (managed by Coolify)
- **Prisma** ORM
- **NextAuth.js** — credentials-based auth (Microsoft Entra ID ready to add later)
- **Tailwind CSS**

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/your-orchard-org/orchard-ops.git
cd orchard-ops
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/orchardops"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Run a local PostgreSQL (Docker)

```bash
docker run --name orchard-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=orchardops -p 5432:5432 -d postgres:16
```

### 4. Push schema and seed

```bash
npx prisma db push
npm run db:seed
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Default credentials (change immediately):
- Email: `adam@orchardtalent.com.au`
- Password: `ChangeMe123!`

---

## Coolify deployment (Vultr Ubuntu)

### Prerequisites

- Coolify installed on your Vultr server
- A PostgreSQL service running in Coolify
- Your Orchard GitHub account connected to Coolify

### Step 1 — Create a PostgreSQL service in Coolify

In Coolify: **New Resource → Database → PostgreSQL**

Note the connection string — it will look like:
```
postgresql://postgres:PASSWORD@HOST:5432/orchardops
```

### Step 2 — Create the application in Coolify

1. **New Resource → Application → GitHub**
2. Select your Orchard GitHub org and the `orchard-ops` repo
3. Set **Build pack**: Dockerfile
4. Set **Port**: 3000

### Step 3 — Environment variables in Coolify

Add these in the Coolify environment variables panel:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Coolify PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Output of `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-domain.com.au` |
| `NODE_ENV` | `production` |

### Step 4 — Deploy

Push to your GitHub repo. Coolify will build and deploy automatically.

### Step 5 — Run migrations and seed

After first deploy, open a terminal in Coolify (or SSH to your server) and run:

```bash
# Find your container ID
docker ps | grep orchard-ops

# Run migrations
docker exec <container-id> npx prisma db push

# Seed the database
docker exec <container-id> npm run db:seed
```

### Step 6 — Set your domain

In Coolify, set the domain to your chosen subdomain (e.g. `ops.orchardtalent.com.au`).
Point your DNS A record to your Vultr server IP.
Coolify handles the SSL certificate automatically via Let's Encrypt.

---

## Adding users

There is no self-registration. Add users directly in the database via Prisma Studio:

```bash
# Locally
npm run db:studio

# Or SSH to server and run via Docker
docker exec -it <container-id> npx prisma studio
```

Or write a seed/script:

```typescript
import bcrypt from "bcryptjs";
// See prisma/seed.ts for the pattern
```

---

## Future: Microsoft Entra ID (SSO)

When ready, add to `src/lib/auth.ts`:

```typescript
import AzureADProvider from "next-auth/providers/azure-ad";

// In providers array:
AzureADProvider({
  clientId:     process.env.AZURE_AD_CLIENT_ID!,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
  tenantId:     process.env.AZURE_AD_TENANT_ID!,
}),
```

Add environment variables: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`

Register the app in Azure Portal → Entra ID → App registrations.

---

## Roadmap

- [ ] Dashboard reporting and charts
- [ ] Deliverables upload and management
- [ ] Notes on engagements
- [ ] User management UI (add/disable team members)
- [ ] Bullhorn API integration (read contacts/companies)
- [ ] Microsoft Entra SSO
- [ ] Remuneration benchmarking module
- [ ] Export to CSV / Excel

---

## Rates reference (June 2026)

| Role | Cost rate | Charge-out |
|---|---|---|
| Partner | $307.00/hr | $750.00/hr |
| Junior consultant | $140.94/hr | $290.00/hr |
| Admin | $123.39/hr | $160.00/hr |

Update in `src/lib/constants.ts` when rates change.
