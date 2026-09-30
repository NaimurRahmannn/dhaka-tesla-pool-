# Ride State Machine

States:

REQUESTED

MATCHED

DRIVER_ARRIVED

STARTED

COMPLETED

CANCELLED


Allowed transitions:

- REQUESTED -> MATCHED or CANCELLED
- MATCHED -> DRIVER_ARRIVED or CANCELLED
- DRIVER_ARRIVED -> STARTED or CANCELLED
- STARTED -> COMPLETED
- COMPLETED and CANCELLED are terminal

Only the backend changes ride status. Each successful transition updates the
ride and creates a RideStatusHistory record in the same Prisma transaction.
The initial REQUESTED history entry has no previous status.

The passenger details UI currently shows its cancel action only for REQUESTED
and MATCHED rides, even though the API's state machine also permits
DRIVER_ARRIVED -> CANCELLED.
