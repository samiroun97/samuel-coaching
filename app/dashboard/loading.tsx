import { Loader } from "@/components/Loader";
export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader size={64}/>
    </div>
  );
}
