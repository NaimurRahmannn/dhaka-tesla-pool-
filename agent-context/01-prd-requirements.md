# PRD Requirements

## Mandatory Technology

Frontend:
- React or Next.js

Backend:
- Node.js

Database:
- Relational database preferred

Docker:
- docker compose up must run the project

Current repository note: the Compose stack starts the services, but applying
migrations and seed data still requires explicit commands. This is a release
setup gap against the one-command expectation in the original PRD.

Required:
- migrations
- seed data
- environment example

## Required Features

Actors:

Passenger:
- Nusrat
- Rafiq
- Shirin

Driver:
- Jashim

Vehicle:
- Bullet
- Capacity: 3

## Ride Lifecycle

Allowed flow:

REQUESTED

↓

MATCHED

↓

DRIVER_ARRIVED

↓

STARTED

↓

COMPLETED


Cancellation:

REQUESTED → CANCELLED

MATCHED → CANCELLED

DRIVER_ARRIVED → CANCELLED

## Pool Rules

- Multiple requests can share one Tesla
- Capacity cannot exceed vehicle capacity
- Every passenger has individual fare
- Pool membership must be visible

## Testing Requirements

Must test:

- capacity protection
- invalid transitions
- pooled fares
- authorization
- cancellation rules
- concurrent seat claims

## Git Requirements

Branches:

master

pre-release

release/v1.0.0

feature/*

Commit format:

type(scope): description

Examples:

feat(pool): add matching logic

fix(pool): prevent overbooking

Repository difference: the repository currently uses `main` as its primary
branch. The original PRD calls for `master`; this remains a submission workflow
difference to resolve, not a change to the original requirement.
