# Engineering Principles

## Principle 1

Correctness over features.

A simple system with correct data integrity is preferred.

## Principle 2

No unnecessary complexity.

Avoid:

- microservices
- Kafka
- Kubernetes
- Redis

unless a real requirement appears.

## Principle 3

Business rules belong in backend.

Frontend should never decide:

- fare
- capacity
- permissions
- ride transitions

## Principle 4

Database protects important invariants.

Examples:

A Tesla cannot have:

available seats < 0

A user cannot modify:

another user's ride

## Principle 5

Every decision must be explainable.

If a technology or pattern exists, we should explain:

- why
- alternatives
- tradeoffs