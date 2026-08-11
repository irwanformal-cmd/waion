import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AuthCard } from "@/components/auth/AuthCard";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return <AuthCard mode="login" />;
}
