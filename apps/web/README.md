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

## Passenger Workflow

- `/passenger`: lists rides for the authenticated passenger.
- `/passenger/rides/new`: submits pickup and destination coordinates through `POST /rides`.
- `/passenger/rides/[id]`: shows ride status, estimated fare when available, and cancellation for cancellable rides.

Passenger pages require a `PASSENGER` user. Drivers are redirected away from passenger-only routes.

The frontend uses the NestJS ride APIs through `src/features/passenger/api/passenger-api.ts`. Components do not call HTTP directly.

## Driver Workflow

- `/driver`: displays driver profile information, vehicle status toggle (`ONLINE` / `OFFLINE`), and assigned pool summary.
- `/driver/pools`: lists assigned ride pools retrieved from `GET /driver/pools`.
- `/driver/rides/[id]`: provides ride lifecycle action controls:
  - `MATCHED`: Arrive at pickup (`PATCH /driver/rides/:id/arrive`)
  - `DRIVER_ARRIVED`: Start ride (`PATCH /driver/rides/:id/start`)
  - `STARTED`: Complete ride (`PATCH /driver/rides/:id/complete`)

Driver pages require a `DRIVER` user. Passenger users are redirected away from driver-only routes.

The frontend uses the NestJS driver APIs through `src/features/driver/api/driver-api.ts`. Components do not call HTTP directly.

## Tests

Run from the repository root:

```bash
npm test --workspace=@dhaka-tesla-pool/web
```

## Structure

- `src/app`: App Router routes.
- `src/features`: auth, passenger, and driver feature modules.
- `src/lib`: shared frontend utilities, including the API client.
- `src/types`: frontend boundary types.
