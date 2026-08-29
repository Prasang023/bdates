# BadDates.fyi

An anonymous, crowdsourced platform tracking the costs of modern dating and date scams across Indian metros.

## 🚀 Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase/Neon)
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS + shadcn/ui

## 🛠 Local Setup

1. **Clone the repo**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Environment Variables**
   Create a `.env` file in the root:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/dbname
   SALT=your_random_salt_string
   ```
4. **Database Migrations**
   ```bash
   npx drizzle-kit push
   ```
5. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🌐 Deployment to Vercel

1. Push your code to GitHub.
2. Connect your repository to Vercel.
3. Add the environment variables (`DATABASE_URL`, `SALT`) in the Vercel Dashboard.
4. Deploy.

## 📖 API Endpoints
- `POST /api/v1/reports`: Submit a bad date report.
- `GET /api/v1/reports`: Fetch reports with filters.
- `GET /api/v1/analytics/city-summary`: Get aggregated city metrics.
- `GET /api/v1/venues/watchlist`: Get flagged scam venues.
