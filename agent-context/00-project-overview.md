# Dhaka Tesla Pool - Project Overview

## Purpose

Build a ride-pooling MVP for Dhaka traffic.

The system allows passengers to request rides, automatically evaluate pool compatibility, share a Tesla vehicle, split fares fairly, and allow drivers to manage trips.

## Core Actors

Driver:
- Jashim

Vehicle:
- Bullet Tesla
- Capacity: 3 seats

Passengers:
- Nusrat
- Rafiq
- Shirin

The story cast must remain consistent in seed data, tests, README, and demo.

## MVP Focus

The difficult engineering problems are:

1. Ride lifecycle management
2. Pool matching
3. Capacity protection
4. Fare calculation
5. Concurrency safety
6. Authorization

## Non Goals

Do not build:

- real payment gateway
- full navigation system
- microservices
- unnecessary infrastructure

Routing APIs may be used for distance and route information, but business decisions remain inside the backend.
