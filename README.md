# Dhaka Tesla Pool

Dhaka Tesla Pool is a ride-pooling MVP foundation for sharing a three-seat Tesla through Dhaka traffic.

## Current Status

Repository foundation and database layer completed.

The repository currently contains the monorepo setup, Next.js web scaffold, NestJS API scaffold, PostgreSQL development container, and database foundation. Product features will be added as development continues.

## Basic Setup

Prerequisites:

- Node.js 20.19 or newer
- npm
- Docker Desktop with Docker Compose

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

Install all workspaces from the repository root:

```powershell
npm install
```

Start PostgreSQL:

```powershell
docker compose up -d db
```

Generate the Prisma client, apply migrations, and load development seed data:

```powershell
npm run db:generate --workspace=@dhaka-tesla-pool/api
npm run db:migrate --workspace=@dhaka-tesla-pool/api
npm run db:seed --workspace=@dhaka-tesla-pool/api
```

Start the web workspace:

```powershell
npm run dev:web
```

Start the API workspace in a second terminal:

```powershell
npm run dev:api
```
