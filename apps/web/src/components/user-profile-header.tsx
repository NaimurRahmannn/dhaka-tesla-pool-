"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";

export function UserProfileHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (logout) {
      logout();
    }
    router.push("/login");
  };

  const isDriver = user?.role === "DRIVER";
  const roleLabel = isDriver ? "Driver" : "Passenger";
  const roleBadgeStyle = isDriver
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div
      data-testid="user-profile-header"
      className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4"
    >
      <div className="flex items-center gap-2.5">
        {/* Profile Avatar Icon */}
        <div
          data-testid="profile-icon"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200 shadow-sm"
          title={`${user?.name ?? "User"} profile`}
          aria-label="Profile"
        >
          <svg
            className="h-5 w-5 text-slate-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              data-testid="user-display-name"
              className="text-sm font-semibold text-slate-900"
            >
              {user?.name ?? "Dhaka Tesla User"}
            </span>
            <span
              data-testid="user-role-badge"
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${roleBadgeStyle}`}
            >
              {roleLabel}
            </span>
          </div>
          {user?.email ? (
            <span className="text-xs text-slate-500 font-normal truncate max-w-[180px] sm:max-w-xs">
              {user.email}
            </span>
          ) : null}
        </div>
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={handleLogout}
        data-testid="logout-button"
        aria-label="Log out"
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-700 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
          />
        </svg>
        <span>Logout</span>
      </button>
    </div>
  );
}
