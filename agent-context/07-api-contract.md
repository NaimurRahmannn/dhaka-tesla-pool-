# API Contract

`GET /` is a public root smoke endpoint used by the Compose API health check.


## Auth

POST /auth/register

POST /auth/login

GET /auth/me


## Passenger

POST /rides

GET /rides

GET /rides/:id

PATCH /rides/:id/cancel


## Driver

GET /driver/pools

GET /driver/vehicles

GET /driver/rides/assigned

GET /driver/rides/completed

GET /driver/rides/nearby?lat=&lng=&radius=

POST /driver/rides/auto-assign

POST /driver/rides/:id/accept

PATCH /driver/vehicles/:id/status

PATCH /driver/rides/:id/arrive

PATCH /driver/rides/:id/start

PATCH /driver/rides/:id/complete


## Pool

No public pool API endpoints are implemented yet.

All ride and driver routes require JWT authentication and the matching
PASSENGER or DRIVER role. `GET /auth/me` requires JWT authentication.
