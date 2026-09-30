"use client";

import { useCallback, useEffect, useState } from "react";
import { getAssignedPools } from "../api/driver-api";
import type { DriverPool } from "../types/driver.types";

export function useDriverPools() {
  const [pools, setPools] = useState<DriverPool[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPools = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getAssignedPools();
      setPools(data);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load assigned pools",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    getAssignedPools()
      .then((data) => {
        if (!ignore) {
          setPools(data);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load assigned pools",
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
  }, []);

  return {
    pools,
    errorMessage,
    isLoading,
    refetch: fetchPools,
  };
}
