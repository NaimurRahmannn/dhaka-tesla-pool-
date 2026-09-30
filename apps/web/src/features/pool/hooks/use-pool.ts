"use client";

import { useCallback, useEffect, useState } from "react";
import { getDriverPools } from "../api/pool-api";
import type { Pool } from "../types/pool.types";

export function usePool(poolId?: string | null, initialPool?: Pool | null) {
  const [pools, setPools] = useState<Pool[]>(initialPool ? [initialPool] : []);
  const [fetchedPool, setFetchedPool] = useState<Pool | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialPool);

  const pool = initialPool ?? fetchedPool;

  const fetchPools = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getDriverPools();
      setPools(data);
      if (poolId) {
        const found = data.find((item) => item.id === poolId) ?? null;
        setFetchedPool(found);
      } else if (data.length > 0) {
        setFetchedPool(data[0]);
      } else {
        setFetchedPool(null);
      }
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load pool data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [poolId]);

  useEffect(() => {
    if (initialPool) {
      return;
    }

    let ignore = false;

    getDriverPools()
      .then((data) => {
        if (!ignore) {
          setPools(data);
          if (poolId) {
            const found = data.find((item) => item.id === poolId) ?? null;
            setFetchedPool(found);
          } else if (data.length > 0) {
            setFetchedPool(data[0]);
          } else {
            setFetchedPool(null);
          }
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Could not load pool data",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [poolId, initialPool]);

  return {
    pool,
    pools,
    isLoading,
    errorMessage,
    refetch: fetchPools,
  };
}
