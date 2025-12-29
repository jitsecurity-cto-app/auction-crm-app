# CRM App

Admin/backoffice Next.js application for managing the auction platform. Administrators can manage auctions, users, and view analytics.

## Overview

The CRM App is a Next.js application that provides administrative tools for managing the auction platform. It communicates with the Database Service API to perform administrative operations.

## Features

- Manage auctions (create, edit, delete)
- User management
- View all bids and transactions
- Analytics dashboard
- System configuration
- Admin authentication

## Security Vulnerabilities

This app intentionally contains security vulnerabilities for educational purposes:
- XSS (Cross-Site Scripting) - Unsanitized user input
- Missing authorization checks (client-side only)
- Weak authentication handling
- Insecure data storage
- No input validation

See `SECURITY.md` for details.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- React
- Tailwind CSS (optional)
- SWR or React Query for data fetching

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Database Service API running
- AWS account for deployment
- Admin account credentials

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

### Running Locally

```bash
# Development mode
npm run dev -- -p 3002

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at `http://localhost:3002`

## Project Structure

```
crm-app/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── auctions/
│   │   ├── users/
│   │   ├── analytics/
│   │   └── login/
│   ├── components/       # React components
│   │   ├── AuctionTable.tsx
│   │   ├── UserManagement.tsx
│   │   └── Dashboard.tsx
│   ├── lib/              # Utilities
│   │   ├── api.ts
│   │   └── auth.ts
│   └── types/            # TypeScript types
├── public/               # Static assets
├── .github/workflows/    # CI/CD pipelines
├── .env.example
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Code Style

- Use TypeScript
- Follow Next.js App Router conventions
- Use Server Components by default
- Client Components only when needed
- Use Tailwind CSS for styling (if configured)

### Admin Features

All admin operations should go through the Database Service API. The API should handle authorization (though it's intentionally weak in this lab).

## Deployment

### AWS Deployment

The app can be deployed to:
- **AWS S3 + CloudFront** (static export)
- **AWS Amplify** (full Next.js support)
- **Vercel** (alternative, not AWS)

### CI/CD

GitHub Actions automatically:
1. Runs tests and linting
2. Builds the Next.js app
3. Deploys to S3/CloudFront or Amplify

Push to `main` branch to trigger deployment.

### Access Control

**Note**: In production, this app should be:
- Behind authentication
- Restricted to admin IPs
- Using VPN or private network
- Protected by additional security layers

For the lab, these protections are intentionally minimal.

## Cost Optimization

- Use S3 for static hosting (very cheap)
- CloudFront CDN for global distribution
- Estimated cost: $1-5/month for low traffic

## License

Educational use only.

