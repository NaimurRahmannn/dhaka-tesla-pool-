# Authorization


Roles: `PASSENGER` and `DRIVER`.

The NestJS API requires JWT authentication on protected routes and checks
role metadata with the global RolesGuard. Registration and login are public.

- Passengers can create, list, view, and cancel only their own rides. The
  passenger ID comes from the authenticated user, never a request body.
- Drivers can list and change vehicles they own and list pools assigned to
  those vehicles. Ride lifecycle actions require a ride assigned through a
  pool to one of their vehicles; that vehicle must be ONLINE.
- Drivers can discover nearby unassigned REQUESTED rides and accept them.
  This discovery permission does not grant lifecycle control over another
  driver's assigned rides.

Authorization is enforced by backend guards and ownership queries. Frontend
route protection improves navigation but is not the security boundary.
