import { useAppStore } from "@/stores/appStore";
import TopNav from "@/components/TopNav";
import UserDashboard from "@/components/UserDashboard";
import PoliceDashboard from "@/components/PoliceDashboard";
import HospitalDashboard from "@/components/HospitalDashboard";
import NHAIDashboard from "@/components/NHAIDashboard";

const Index = () => {
  const role = useAppStore((s) => s.role);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="pt-16">
        {role === "user" && <UserDashboard />}
        {role === "police" && <PoliceDashboard />}
        {role === "hospital" && <HospitalDashboard />}
        {role === "nhai" && <NHAIDashboard />}
      </main>
    </div>
  );
};

export default Index;
