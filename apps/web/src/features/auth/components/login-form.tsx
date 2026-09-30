"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useAuth } from "../hooks/use-auth";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Login failed";
}

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await login({ email, password });

      router.push(response.user.role === "DRIVER" ? "/driver" : "/passenger");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-950">Login</h1>
        <p className="text-sm text-slate-600">
          Sign in as a passenger or driver.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
        Email
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
        Password
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in" : "Sign in"}
      </button>

      <p className="text-sm text-slate-600">
        Need an account?{" "}
        <Link className="font-semibold text-emerald-700" href="/register">
          Register
        </Link>
      </p>
    </form>
  );
}
