# Domain Model

Entities:

User

Vehicle

RideRequest

RouteSnapshot

Pool

PoolMember

RideStatusHistory


Relationship:

Driver owns Vehicle

Vehicle operates Pool

Pool contains PoolMembers

Passenger creates RideRequest

PoolMember links one RideRequest to one Pool

One RideRequest can have many RouteSnapshots and RideStatusHistory entries.

One RideRequest can have at most one PoolMember because its membership foreign
key is unique. A driver can own many Vehicles; a Vehicle can operate many Pools
over time.
