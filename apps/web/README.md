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
- `/passenger/rides/[id]`: shows ride status, estimated fare when available, cancellation for cancellable rides, and pooled ride visibility.

### Passenger Pool Visibility

When a passenger's ride belongs to a pool:
- Displays a dedicated pool section indicating "Your ride is pooled".
- Displays pool ID, pool status (with lifecycle progress), and member count only.
- Private information of other passengers (names, locations, fares) is strictly kept private and hidden.
- When a ride is not pooled, the pool section is automatically hidden.

Passenger pages require a `PASSENGER` user. Drivers are redirected away from passenger-only routes.

The frontend uses the NestJS ride APIs through `src/features/passenger/api/passenger-api.ts`. Components do not call HTTP directly.

## Driver Workflow

- `/driver`: displays driver profile information, vehicle status toggle (`ONLINE` / `OFFLINE`), and assigned pool summary.
- `/driver/pools`: lists assigned ride pools retrieved from `GET /driver/pools`.
- `/driver/rides/[id]`: provides ride lifecycle action controls:
  - `MATCHED`: Arrive at pickup (`PATCH /driver/rides/:id/arrive`)
  - `DRIVER_ARRIVED`: Start ride (`PATCH /driver/rides/:id/start`)
  - `STARTED`: Complete ride (`PATCH /driver/rides/:id/complete`)

### Driver Pool Visibility

- `/driver/pools`: displays improved pool cards for each assigned pooling group.
- Pool cards display:
  - Pool ID
  - Vehicle information (`Bullet Tesla`)
  - Pool status badge and lifecycle state (`MATCHING` -> `ACTIVE` -> `COMPLETED`)
  - Passenger member count with vehicle capacity (e.g. `2/3`)

Driver pages require a `DRIVER` user. Passenger users are redirected away from driver-only routes.

The frontend uses the NestJS driver APIs through `src/features/driver/api/driver-api.ts` and `src/features/pool/api/pool-api.ts`. Components do not call HTTP directly.

## Pool Feature (`src/features/pool`)

Contains the frontend pool visualization architecture:
- `api/pool-api.ts`: isolated API communication with backend pool endpoints (`GET /driver/pools`).
- `hooks/use-pool.ts`: fetches assigned pool data and manages loading, error, and refetch states.
- `components/pool-card.tsx`: reusable pool card supporting both passenger and driver views.
- `components/pool-status.tsx`: status badge and lifecycle visualizer (`MATCHING` -> `ACTIVE` -> `COMPLETED`).
- `components/pool-members.tsx`: member count indicator that protects passenger privacy.
- `types/pool.types.ts`: typed contracts for `Pool`, `PoolStatus`, and `PoolMember`.

## Map & Route Visualization (`src/features/map`)

### Map Provider Choice
- **React Leaflet** with **OpenStreetMap (OSM)** tiles.
- 100% free and open-source map provider (no API keys, billing accounts, or paid map providers required).
- Centered on Dhaka metropolitan hub (Banani / Gulshan area).

### Map Setup Instructions
1. **Dependencies**: `leaflet`, `react-leaflet`, `@types/leaflet`.
2. **Leaflet CSS**: Leaflet styles are imported via `leaflet/dist/leaflet.css`.
3. **Client-Side Rendering**: Because Leaflet relies on browser `window` APIs (`window.requestAnimationFrame`), the interactive map view is encapsulated in a client component and loaded with Next.js dynamic import (`ssr: false`) to ensure clean server-side prerendering without SSR crashes.
4. **Environment Configuration**: Set `NEXT_PUBLIC_OSRM_URL` (defaults to `https://router.project-osrm.org`) if using a dedicated local OSRM routing container.

### Route Visualization Flow
1. **Passenger Ride Creation (`/passenger/rides/new`)**:
   - Opens the interactive MapView centered on Dhaka.
   - User toggles between "1. Set Pickup" and "2. Set Destination" mode.
   - Clicking on the map sets the precise geographic coordinates (latitude and longitude).
   - Once both coordinates are selected, `useMapRoute` queries the routing backend (OSRM) to fetch the road route geometry, estimated driving distance, and duration.
   - Displays a route preview summary (distance in km, duration in minutes) and renders the route polyline with emerald pickup ("P") and red destination ("D") markers.
   - User submits the ride via `POST /rides` using the collected coordinates. Backend owns all fare calculation and pooling compatibility logic.
2. **Driver Ride Route View (`/driver/rides/[id]`)**:
   - When a driver inspects an assigned ride that has pickup and destination coordinates, the route visualization panel is rendered.
   - Displays pickup point, destination point, and the connected route polyline on the map.
   - Does not provide live GPS tracking, driver tracking, or turn-by-turn navigation (explicitly out of scope).

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
