"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { register } from "../api/auth-api";
import type { RegisterRequest } from "../types/auth.types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Registration failed";
}

export function RegisterForm() {
  const [form, setForm] = useState<RegisterRequest>({
    name: "",
    email: "",
    password: "",
    role: "PASSENGER",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const user = await register(form);

      setSuccessMessage(`${user.name} registered. You can sign in now.`);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "PASSENGER",
      });
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
        <h1 className="text-2xl font-semibold text-slate-950">Register</h1>
        <p className="text-sm text-slate-600">
          Create a passenger or driver account.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
        Name
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600"
          name="name"
          type="text"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
        Email
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600"
          name="email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
        Password
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600"
          name="password"
          type="password"
          value={form.password}
          onChange={(event) =>
            setForm({ ...form, password: event.target.value })
          }
          required
          minLength={8}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
        Role
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-600"
          name="role"
          value={form.role}
          onChange={(event) =>
            setForm({
              ...form,
              role: event.target.value as RegisterRequest["role"],
            })
          }
        >
          <option value="PASSENGER">Passenger</option>
          <option value="DRIVER">Driver</option>
        </select>
      </label>

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <button
        className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating account" : "Create account"}
      </button>

      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-semibold text-emerald-700" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
