"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";

export function SignupForm({ callbackURL }: { callbackURL: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL,
      });
      if (error) {
        setError(error.message ?? "Sign up failed. Try again.");
        setPending(false);
      } else {
        router.push(callbackURL);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Try again.");
      setPending(false);
    }
  }

  return (
    <>
      <div className="rounded-md border border-zinc-300 bg-white p-6">
        <h1 className="text-2xl font-medium text-zinc-900">Create account</h1>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="block text-sm font-medium text-zinc-900"
            >
              Your name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#febd69]"
            />
          </div>
          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-zinc-900"
            >
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#febd69]"
            />
          </div>
          <div>
            <label
              htmlFor="signup-password"
              className="block text-sm font-medium text-zinc-900"
            >
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-400 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#febd69]"
            />
            <p className="mt-1 text-xs text-zinc-500">
              At least 8 characters.
            </p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-[#c40000]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-[#ffd814] px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-[#f7ca00] disabled:opacity-60"
          >
            {pending ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link
          href={`/login?callbackURL=${encodeURIComponent(callbackURL)}`}
          className="text-[#007185] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
