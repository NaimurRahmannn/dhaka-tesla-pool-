# Pool Matching Algorithm

## Goal

Determine whether two passenger ride requests can share Bullet Tesla.

The pool engine owns compatibility decisions.

The routing service only provides route information.

---

# Routing Approach

The MVP uses a routing provider instead of predefined destination zones.

Preferred routing provider:

- OpenStreetMap data
- OSRM routing service

Routing service provides:

- distance
- duration
- route geometry

Example:

Nusrat:
Banani to Motijheel

Rafiq:
Banani to Motijheel

The backend stores routing results as route snapshots.

---

# Route Corridor Concept

A route corridor represents similarity between two trips.

It is generated from actual route information.

The pool engine does not use manually defined Dhaka zones.

A corridor comparison considers:

- pickup proximity
- destination proximity
- route detour impact

---

# MVP Compatibility Rules

Two rides are compatible when all conditions pass.

## 1. Pickup Compatibility

Distance between pickup points:

```text
pickupDistance <= 2000 meters
```

Example:

Nusrat pickup:
Banani

Rafiq pickup:
Banani

Compatible.

## 2. Destination Compatibility

Distance between destination points:

```text
destinationDistance <= 3000 meters
```

Example:

Nusrat destination:
Motijheel

Rafiq destination:
Paltan

Compatible.

## 3. Route Detour Constraint

The additional distance caused by pooling must not exceed:

```text
30%
```

Formula:

```text
detourPercent = ((sharedRouteDistance - soloRouteDistance) / soloRouteDistance) * 100
```

Calculate this for both rides using each ride's latest solo route snapshot.
Compatibility uses the larger of the two detour percentages. Initial pool
creation checks every pair when more than two rides are supplied.

Example:

Nusrat solo route:
10000 meters

Shared route:
12000 meters

Detour:

```text
((12000 - 10000) / 10000) * 100 = 20%
```

Compatible.

## Shared Route Distance Assumption

The routing service calculates the combined route distance.

The pool engine does not approximate shared distance.

For each pair, the current implementation uses this fixed waypoint sequence:

```text
pickup 1 -> pickup 2 -> destination 1 -> destination 2
```

The first and second rides come from the database result order, which is not
explicitly sorted. Waypoint ordering is not optimized.

A future implementation could optimize pickup and drop-off ordering.

---

# Capacity Rule

A pool cannot exceed vehicle capacity.

Bullet capacity:

```text
3 seats
```

Before adding a passenger:

```text
currentSeats + requestedSeats <= vehicle.capacity
```

must be true.

---

# Ride Eligibility

Only rides with matchable statuses can enter pooling.

Allowed:

```text
REQUESTED
```

Not allowed:

```text
MATCHED
DRIVER_ARRIVED
STARTED
COMPLETED
CANCELLED
```

---

# Current Implementation Gap

`PoolCreationService` applies the route compatibility rules to initial ride
sets. The driver acceptance path that adds a ride to an existing pool currently
uses `PoolSeatAllocationService`, which enforces capacity but does not rerun
route compatibility or calculate the pooled fare. This is a code gap to fix;
it does not relax the compatibility and individual-fare requirements above.

---

# Pool Matching Responsibility

Pool engine owns:

- compatibility rules
- matching decisions
- capacity checks
- pool membership creation

Routing service owns:

- route calculation
- distance
- duration
- geometry

Fare service owns:

- fare calculation

---

# Concurrency

Seat allocation must be protected by database transactions.

When multiple passengers attempt to join the last available seat:

- lock pool row
- recheck capacity
- insert membership only if capacity remains

PostgreSQL row locking:

```sql
SELECT ... FOR UPDATE
```

prevents overbooking.

---

# Why This Matters

These rules prevent later implementations from inventing:

- random radius values
- predefined Dhaka zones
- fake same-destination logic
- arbitrary overlap calculations
