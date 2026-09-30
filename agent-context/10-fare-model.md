# Fare Model

## Currency

All monetary values are integer paisa (100 paisa = BDT 1). The API returns
integer paisa and the frontend formats it as taka. Integer storage avoids
floating-point currency values.

## Current API Pricing

- Base fare: BDT 20 = 2,000 paisa
- Distance charge: BDT 5 = 500 paisa per started kilometer
- Pool discount: 20% of the subtotal

`apps/api/src/fare/fare.config.ts` contains these values. `FareService` uses
the following calculation:

```text
billedKilometers = ceil(distanceMeter / 1000)
distanceChargePaisa = billedKilometers * 500
subtotalPaisa = 2000 + distanceChargePaisa
poolDiscountPaisa = isPooled ? floor(subtotalPaisa * 20 / 100) : 0
finalFarePaisa = subtotalPaisa - poolDiscountPaisa
```

Distance must be non-negative. Zero distance costs the base fare. The discount
is rounded down so all returned money fields remain integer paisa.

## Worked Examples

Nusrat's 5 km solo route: `2000 + 5 * 500 = 4500` paisa (BDT 45).
If pooled, the discount is `floor(4500 * 0.20) = 900` paisa, making her fare
3,600 paisa (BDT 36).

Rafiq's 4 km solo route: `2000 + 4 * 500 = 4000` paisa (BDT 40).
If pooled, the discount is 800 paisa, making his fare 3,200 paisa (BDT 32).

A route of 5,230 meters is billed as 6 km. Its solo fare is 5,000 paisa
(BDT 50), and its pooled fare is 4,000 paisa (BDT 40).

## Ownership and Current Behavior

The API calculates fares from routing distance; each passenger has an
individual fare, stored as `RideRequest.estimatedFarePaisa` and, for pool
members, `PoolMember.farePaisa`. There is no single shared pool fare.

The browser ride form mirrors the current API rates for a pre-submission fare
preview. The API remains authoritative: it calculates and stores the fare from
its own OSRM route when the ride is created.

Adding a ride to an existing pool currently stores the solo estimate instead
of recalculating the pooled fare; see `09-pooling-algorithm.md`. This is an
implementation gap, not an alternate fare rule.
