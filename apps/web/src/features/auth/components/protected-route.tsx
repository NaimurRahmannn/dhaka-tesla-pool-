"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { UserRole } from "@/types";
import { useAuth } from "../hooks/use-auth";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: UserRole;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRole && user && user.role !== requiredRole) {
      router.replace(user.role === "DRIVER" ? "/driver" : "/passenger");
    }
  }, [isAuthenticated, requiredRole, router, user]);

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole) {
    if (!user) {
      return null;
    }

    if (user.role !== requiredRole) {
      return null;
    }
  }

  return children;
}
