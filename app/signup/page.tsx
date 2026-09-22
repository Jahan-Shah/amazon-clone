import { redirect } from "next/navigation";

import { SignupForm } from "@/components/signup-form";
import { getSession, toSafeCallbackPath } from "@/lib/session";

export default async function SignupPage({
  searchParams,
}: PageProps<"/signup">) {
  const { callbackURL } = await searchParams;
  const callbackPath = toSafeCallbackPath(callbackURL);
  if (await getSession()) redirect(callbackPath);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 py-10">
      <SignupForm callbackURL={callbackPath} />
    </main>
  );
}
