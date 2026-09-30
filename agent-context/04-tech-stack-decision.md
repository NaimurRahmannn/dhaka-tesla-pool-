# Technology Decisions

## Frontend

Chosen:

Next.js + TypeScript

Reason:

- recommended by PRD
- maintainable
- strong ecosystem


## Backend

Chosen:

NestJS + TypeScript

Reason:

- modular architecture
- validation
- dependency injection
- testability


## Database

Chosen:

PostgreSQL

Reason:

Ride pooling requires relational consistency:

Vehicle
→ Pool
→ Pool Members
→ Individual Fares


## ORM

Chosen:

Prisma

Reason:

- type safety
- migrations
- readable schema


## Authentication

Chosen:

JWT

Reason:

- role-based API access
- stateless authentication


## Routing

Chosen:

OSRM + OpenStreetMap

Reason:

- free
- no paid API dependency
- provides distance and route information

Alternative:

Google Maps API

Switch when:

- enterprise routing accuracy is required
- budget allows paid services

## UI and Maps

Chosen:

- Tailwind CSS for web styling
- Leaflet with OpenStreetMap tiles for browser maps

The browser requests OSRM routes for previews. The API calculates its own route
for persisted rides and pool matching.

## Testing and CI

Chosen:

- Vitest for API and web tests
- Testing Library for React components
- GitHub Actions for Prisma validation, lint, tests, builds, and Compose config

Database-backed concurrency integration tests are not part of the current CI
workflow; the existing service tests use mocks.

## Deployment

The maintainer reports the web app on Vercel, the API on Render, and PostgreSQL
on Neon. Docker Compose runs the API, web app, and PostgreSQL locally.
