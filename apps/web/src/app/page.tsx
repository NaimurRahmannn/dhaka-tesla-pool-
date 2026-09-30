import Link from "next/link";

const routes = [
  {
    href: "/login",
    label: "Login",
    description: "Sign in with an existing passenger or driver account.",
  },
  {
    href: "/register",
    label: "Register",
    description: "Create a passenger or driver account.",
  },
  {
    href: "/passenger",
    label: "Passenger",
    description: "Passenger workspace for booking rides and tracking ride status.",
  },
  {
    href: "/driver",
    label: "Driver",
    description: "Driver workspace for managing vehicle status and assigned pools.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Dhaka Tesla Pool
        </p>
        <h1 className="text-3xl font-semibold text-slate-950">
          Frontend foundation for passenger and driver workflows
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-700">
          This Next.js app is prepared to communicate with the NestJS API while
          keeping ride, fare, authorization, and pooling decisions in the
          backend.
        </p>
      </section>

      <nav className="grid gap-4 sm:grid-cols-2" aria-label="Application areas">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-500 hover:shadow"
          >
            <span className="block text-lg font-semibold text-slate-950">
              {route.label}
            </span>
            <span className="mt-2 block text-sm leading-6 text-slate-600">
              {route.description}
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
