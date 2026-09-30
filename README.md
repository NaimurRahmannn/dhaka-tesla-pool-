# Dhaka Tesla Pool

Dhaka Tesla Pool is a ride-pooling MVP foundation for sharing a three-seat Tesla through Dhaka traffic.

## Current Status

The application currently includes:

- Authentication with JWT and role authorization.
- Routing service integration through OSRM.
- Fare engine using integer paisa.
- Passenger ride request workflow.
- Ride lifecycle management with status history.
- Pool matching engine.
- Pool creation workflow.
- Transactional seat allocation.
- Pool lifecycle management.
- Driver vehicle availability, assigned pool retrieval, and ride lifecycle actions.
- Next.js frontend with authentication flow, App Router, Tailwind CSS, and typed client boundaries.
- Passenger frontend ride workflow for creating, listing, viewing, and cancelling rides.

The repository also includes the monorepo setup, NestJS API, PostgreSQL development container, Prisma migrations, and deterministic seed data.

## Frontend Application

The web app lives in `apps/web` and uses Next.js, TypeScript, the App Router, Tailwind CSS, and ESLint.

The frontend is organized around future workflow boundaries:

- `src/features/auth`
- `src/features/passenger`
- `src/features/driver`
- `src/features/pool`
- `src/lib`
- `src/hooks`
- `src/types`

The browser app communicates with the NestJS API through `src/lib/api-client.ts`. The API base URL is configured with `NEXT_PUBLIC_API_URL`, and authenticated requests attach the stored JWT bearer token.

Frontend routes are available for:

- `/login`
- `/register`
- `/passenger`
- `/passenger/rides/new`
- `/passenger/rides/:id`
- `/driver`
- `/driver/pools`
- `/driver/rides/:id`

The authentication flow uses the existing NestJS endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

After login, passengers are routed to `/passenger` and drivers are routed to `/driver`. The frontend stores the MVP access token in `localStorage`; refresh tokens are not implemented.

Passenger routes require an authenticated `PASSENGER` user. Drivers are redirected away from passenger-only pages.
Driver routes require an authenticated `DRIVER` user. Passengers are redirected away from driver-only pages.

The passenger workflow uses the existing NestJS ride endpoints:

- `GET /rides`
- `POST /rides`
- `GET /rides/:id`
- `PATCH /rides/:id/cancel`

When a passenger ride belongs to a pool, `/passenger/rides/:id` displays pool visibility:
- Pool ID
- Pool lifecycle status (`MATCHING` -> `ACTIVE` -> `COMPLETED`)
- Pooled member count only (protecting other passengers' private data)
When a ride is not pooled, the pool section remains hidden.

The driver workflow uses the existing NestJS driver endpoints:

- `GET /driver/pools`
- `GET /driver/rides/assigned`
- `GET /driver/rides/completed`
- `PATCH /driver/vehicles/:id/status`
- `PATCH /driver/rides/:id/arrive`
- `PATCH /driver/rides/:id/start`
- `PATCH /driver/rides/:id/complete`

The driver pool visualization on `/driver/pools` displays improved pool cards showing:
- Pool ID
- Assigned vehicle information (`Bullet Tesla`)
- Pool status and lifecycle state
- Member count with vehicle capacity (e.g. `2/3`)

The frontend collects coordinates and executes lifecycle transitions directly. Maps, GPS, live tracking, and payments are not implemented.

## Pooling Engine

The pool engine decides whether ride requests can share a vehicle.

Routing provides:

- distance
- duration
- geometry

Pooling owns:

- compatibility decisions
- pool creation
- capacity validation
- membership creation

No predefined Dhaka zones are used. The system uses OSRM route information and backend-owned matching rules.

## Matching Rules

Two ride requests are compatible only when all MVP rules pass:

- Pickup compatibility: pickup distance must be `<= 2000` meters.
- Destination compatibility: destination distance must be `<= 3000` meters.
- Maximum detour: shared-route detour must be `<= 30%`.

Pickup and destination distances are calculated with the Haversine formula. Detour is calculated from solo route distance and shared route distance:

```text
detourPercent = ((sharedRouteDistance - soloRouteDistance) / soloRouteDistance) * 100
```

## Shared Route Distance

The pool engine does not estimate shared route distance.

`RoutingService` calculates the combined route through waypoints and returns the route distance. The MVP uses deterministic waypoint ordering:

```text
pickup 1 -> pickup 2 -> destination 1 -> destination 2
```

A production system could optimize pickup and drop-off ordering, but the current implementation keeps the ordering deterministic and testable.

## Concurrency

Seat allocation is protected by PostgreSQL transactions.

Before recalculating capacity, the backend locks the pool row:

```sql
SELECT ... FOR UPDATE
```

Without locking, two users could both see the last available seat and create memberships at the same time. With row locking, those transactions serialize, capacity is recalculated inside the transaction, and the second request is rejected if no capacity remains.

## Driver Workflow

Driver endpoints require JWT authentication and the `DRIVER` role. Driver identity comes from the authenticated user, not request bodies or query parameters.

Implemented driver endpoints:

- `GET /driver/pools`: returns pools assigned to vehicles owned by the authenticated driver.
- `GET /driver/rides/assigned`: returns active rides assigned through the driver's vehicle pools.
- `GET /driver/rides/completed`: returns recent completed rides assigned through the driver's vehicle pools.
- `PATCH /driver/vehicles/:id/status`: updates one of the driver's own vehicles to `ONLINE` or `OFFLINE`.
- `PATCH /driver/rides/:id/arrive`: transitions an assigned ride from `MATCHED` to `DRIVER_ARRIVED`.
- `PATCH /driver/rides/:id/start`: transitions an assigned ride from `DRIVER_ARRIVED` to `STARTED`.
- `PATCH /driver/rides/:id/complete`: transitions an assigned ride from `STARTED` to `COMPLETED`.

Driver ride lifecycle actions verify that the ride is assigned through a pool to a vehicle owned by the authenticated driver. The assigned vehicle must be `ONLINE`. Ride status changes use the ride transition service. Starting a ride activates its matching pool, and completing the last ride in a matching or active pool completes the pool through the pool transition service.

## Basic Setup

Prerequisites:

- Node.js 20.19 or newer
- npm
- Docker Desktop with Docker Compose

Create the local environment file:

```powershell
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env.local
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

By default this starts the Next.js app on `http://localhost:3001`.

Start the API workspace in a second terminal:

```powershell
npm run dev:api
```

Run frontend tests:

```powershell
npm test --workspace=@dhaka-tesla-pool/web
```
