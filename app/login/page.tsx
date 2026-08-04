import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { LoginForm } from "../../components/login-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.role) redirect(`/${session.user.role.toLowerCase()}`);
  return <LoginForm />;
}
