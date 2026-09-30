# Dhaka Tesla Pool Web

Next.js frontend workspace for Dhaka Tesla Pool.

## Development

Run from the repository root:

```bash
npm run dev:web
```

The app starts on `http://localhost:3001`.

## Environment

Create a local environment file from the example:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Set `NEXT_PUBLIC_API_URL` to the NestJS API base URL.

## Structure

- `src/app`: App Router routes.
- `src/features`: future auth, passenger, and driver workflow boundaries.
- `src/lib`: shared frontend utilities, including the API client.
- `src/types`: frontend boundary types.
