import type { RideStatus } from '../../generated/prisma/client.js';

export interface RideResult {
  id: string;
  status: RideStatus;
}
