import Sidebar from "@/components/Sidebar";
import MobileTabBar from "@/components/MobileTabBar";
import { requireUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar userName={user.name} userEmail={user.email} />
      <main className="flex-1 min-w-0 p-4 pb-24 lg:p-8">{children}</main>
      <MobileTabBar />
    </div>
  );
}
