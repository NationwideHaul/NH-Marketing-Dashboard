import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DateRangeProvider } from "@/context/date-range-context";
import { DashboardProvider } from "@/context/dashboard-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DateRangeProvider>
      <DashboardProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-background p-4">
              {children}
            </main>
          </div>
        </div>
      </DashboardProvider>
    </DateRangeProvider>
  );
}
