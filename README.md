# Omnixia

A full-stack agency operations platform built for **The Wick Firm** to manage clients, projects, tasks, onboarding, and performance metrics.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **Hosting:** Vercel
- **Styling:** Inline styles with centralized theme

## Features

### Agency Dashboard
- Overview stats (active clients, projects, team members)
- Recent projects with progress tracking
- Recent clients with status badges

### Client Management
- Full CRUD operations
- Client status tracking (Lead → Onboarding → Active → Paused → Churned)
- Contact details and monthly retainer tracking
- Per-client onboarding checklists
- Task management with categories, priorities, and due dates

### Project Management
- Project creation with service type selection
- Stage-based progress tracking
- Stage templates per service type (SEO, AEO, Web Development, Paid Media, etc.)
- Budget and timeline tracking

### Metrics & Reporting
Comprehensive monthly metrics tracking for:
- **Analytics:** Google Analytics, Google Search Console
- **SEO:** Keyword rankings, backlinks, domain rating
- **AEO:** AI visibility score, citations, brand mentions
- **Paid Media:** META, Google Ads, LinkedIn Ads, TikTok Ads
- **Social Media:** Instagram, Facebook, LinkedIn, TikTok, Twitter/X
- **Content:** Blog posts, social posts, emails, videos, graphics
- **Hours:** Time tracking by service category

### Client Portal
Separate interface for clients to view:
- Their projects and progress
- Pending tasks
- Onboarding status
- Performance metrics

### Team Management
- User roles: Admin, Manager, Specialist, Client
- Link client users to their client accounts
- Activity tracking

### Settings
- Onboarding templates
- Stage templates per service type
- Task categories

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/[...nextauth]/ # Authentication
│   │   ├── clients/            # Client CRUD + metrics, tasks, onboarding
│   │   ├── projects/           # Project CRUD + stages
│   │   ├── team/               # Team member management
│   │   ├── metrics/            # Metrics CRUD
│   │   ├── stage-templates/    # Stage template management
│   │   ├── onboarding-templates/
│   │   └── task-categories/
│   ├── clients/                # Client pages
│   │   ├── [id]/               # Client detail, edit, metrics, tasks
│   │   └── new/                # Add client
│   ├── projects/               # Project pages
│   │   ├── [id]/               # Project detail, edit
│   │   └── new/                # Add project
│   ├── portal/                 # Client portal
│   │   ├── projects/
│   │   ├── tasks/
│   │   └── metrics/
│   ├── team/                   # Team management
│   ├── settings/               # App settings
│   ├── dashboard/              # Main dashboard
│   └── login/                  # Authentication
├── components/
│   ├── Header.tsx              # Agency header/nav
│   ├── PortalHeader.tsx        # Client portal header
│   └── providers.tsx           # Session provider
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── prisma.ts               # Prisma client
│   └── theme.ts                # Centralized styling
└── middleware.ts               # Route protection
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)

### 1. Clone and Install

```bash
git clone https://github.com/wickfirm/wick-portal-v2.git
cd wick-portal-v2
npm install
```

### 2. Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

For Supabase, use the **pooled connection string** from Project Settings → Database → Connection string → URI (with connection pooling).

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Database Setup

Push the schema to your database:

```bash
npx prisma db push
```

Generate Prisma client:

```bash
npx prisma generate
```

### 4. Seed Initial Data (Optional)

Create an admin user directly in Supabase SQL Editor:

```sql
INSERT INTO users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'admin-001',
  'admin@thewickfirm.com',
  '$2a$10$rQEY9VHPvHfP4qPtT0VZ5.vQHZLVXCJWKBFX9v8r3ZJxjnQU6ZD2e',
  'Admin User',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

Default password: `admin123`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel domain)
4. Deploy

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access to all features |
| **Manager** | Manage clients, projects, team |
| **Specialist** | View and update assigned work |
| **Client** | Client portal only (own data) |

## Service Types

- SEO
- AEO (AI Engine Optimization)
- Web Development
- Paid Media
- Social Media
- Content
- Branding
- Consulting

## Theme Customization

Edit `src/lib/theme.ts` to customize colors, gradients, and styling:

```typescript
export const theme = {
  colors: {
    primary: "#e85a4f",      // Brand red
    accent: "#f8b739",       // Brand gold
    // ...
  },
  // ...
};
```

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/clients` | GET, POST | List/create clients |
| `/api/clients/[id]` | GET, PUT, DELETE | Client CRUD |
| `/api/clients/[id]/metrics` | GET, POST | Client metrics |
| `/api/clients/[id]/tasks` | GET, POST | Client tasks |
| `/api/clients/[id]/onboarding` | GET, POST | Onboarding items |
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/[id]` | GET, PUT, DELETE | Project CRUD |
| `/api/team` | GET, POST | List/create team members |
| `/api/team/[id]` | GET, PUT, DELETE | Team member CRUD |

## License

Private — The Wick Firm

---

Built with ❤️ by The Wick Firm
