import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getSession, toSafeCallbackPath } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { callbackURL } = await searchParams;
  const callbackPath = toSafeCallbackPath(callbackURL);
  if (await getSession()) redirect(callbackPath);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 py-10">
      <LoginForm callbackURL={callbackPath} />
    </main>
  );
}
