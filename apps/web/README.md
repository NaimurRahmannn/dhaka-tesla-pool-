# Dhaka Tesla Pool Web

Next.js frontend workspace for Dhaka Tesla Pool.

The web app connects to the NestJS authentication API for registration,
login, current-user hydration, and bearer-token API requests.

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

## Authentication

- `/register`: creates passenger or driver accounts through `POST /auth/register`.
- `/login`: signs in through `POST /auth/login`.
- Authenticated API requests attach the stored JWT access token.
- `/passenger` and `/driver` use the frontend protected-route boundary.
- Tokens are stored in `localStorage` for the MVP; refresh tokens are not implemented.

## Tests

Run from the repository root:

```bash
npm test --workspace=@dhaka-tesla-pool/web
```

## Structure

- `src/app`: App Router routes.
- `src/features`: future auth, passenger, and driver workflow boundaries.
- `src/lib`: shared frontend utilities, including the API client.
- `src/types`: frontend boundary types.
