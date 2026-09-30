# Dhaka Tesla Pool

Dhaka Tesla Pool is a ride-pooling MVP foundation for sharing a three-seat Tesla through Dhaka traffic.

## Current Status

The backend currently includes:

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

The repository also includes the monorepo setup, Next.js web scaffold, NestJS API, PostgreSQL development container, Prisma migrations, and deterministic seed data.

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
- `PATCH /driver/vehicles/:id/status`: updates one of the driver's own vehicles to `ONLINE` or `OFFLINE`.
- `PATCH /driver/rides/:id/arrive`: transitions an assigned ride from `MATCHED` to `DRIVER_ARRIVED`.
- `PATCH /driver/rides/:id/start`: transitions an assigned ride from `DRIVER_ARRIVED` to `STARTED`.
- `PATCH /driver/rides/:id/complete`: transitions an assigned ride from `STARTED` to `COMPLETED`.

Driver ride lifecycle actions verify that the ride is assigned through a pool to a vehicle owned by the authenticated driver. The assigned vehicle must be `ONLINE`. Ride status changes use the ride transition service, and completing the last ride in an active pool completes the pool through the pool transition service.

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
