# Architecture Decisions

## Architecture Style

Monolithic application.

Reason:

The MVP needs clear business logic and data consistency, not distributed complexity.

The NestJS backend is a modular monolith. The Next.js frontend is a separate
application deployment and communicates with it over HTTP.

## High Level Flow

Browser

↓

Next.js Frontend

↓

NestJS API

↓

PostgreSQL


Routing Service (OSRM/OpenStreetMap)

used for:

- distance calculation
- route geometry

not for business decisions.

A reachable OSRM provider is required for ride creation and route-based pool
compatibility checks. The browser also calls OSRM directly for map previews.

---

## Business Logic Location

Backend modules:

auth

users

vehicles

rides

pooling

routing

fare


---

## Database Responsibility

PostgreSQL handles:

- persistence
- constraints
- transactions
- concurrency protection

The database is the final authority for seat allocation.
