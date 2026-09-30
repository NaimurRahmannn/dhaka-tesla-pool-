# Concurrency Handling

## Problem

Bullet has one remaining seat.

Nusrat and Shirin request it at almost the same time.

Both initially see:

available seats = 1


Only one request should succeed.

---

# MVP Solution

Use PostgreSQL transactions and row locks.

For new pool creation, `PoolCreationService` locks the vehicle row with
`SELECT ... FOR UPDATE` before checking for an existing MATCHING or ACTIVE
pool. The pool, memberships, fares, and ride transitions then succeed or fail
together inside one Prisma transaction.

For a join to an existing pool, `PoolSeatAllocationService` locks the pool
row with `SELECT ... FOR UPDATE`, sums `PoolMember.seatCount` inside the same
transaction, reads vehicle capacity, and inserts only when:

```text
currentSeats + requestedSeats <= vehicle.capacity
```

The second last-seat claimant waits, then rechecks the updated membership
total. If capacity is exhausted, it is rejected and its transaction rolls
back. There is no separate allocation counter to update.

---

# Why

The database provides atomic consistency and serializes claims for the same
pool row.

The application never trusts a previous seat count.

---

# Future Scaling

At larger scale consider:

- distributed locks
- queues
- matching workers
- event processing

But MVP uses database transactions.
