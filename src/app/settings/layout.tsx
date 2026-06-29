import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Shell from "@/components/Shell";
import SettingsNav from "@/components/SettingsNav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <Shell>
      <div className="max-w-container mx-auto px-gutter py-7">
        <h1 className="text-xl font-black text-heading tracking-tight mb-5">Settings</h1>
        <SettingsNav />
        {children}
      </div>
    </Shell>
  );
}
