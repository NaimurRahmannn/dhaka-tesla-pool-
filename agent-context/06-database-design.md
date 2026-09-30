# Database Rules

## Users

Stores:

- passengers
- drivers


## Vehicles

Stores:

- Tesla information
- capacity


## Ride Requests

Represents passenger intent.


## Route Snapshots

Stores OSRM distance, duration, and JSONB geometry over time. One ride request
can have many route snapshots; the ride request foreign key is not unique.


## Pools

Represents shared Tesla journey.


## Pool Members

Connects passengers to pools.

Each membership stores a positive seat count and an individual, non-negative
fare in integer paisa. `ride_request_id` is unique, so one ride request has at
most one membership. Capacity across all members is checked transactionally.


## Status History

Stores every lifecycle transition.

Never overwrite history.
