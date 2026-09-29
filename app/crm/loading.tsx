import { Loader } from "@/components/Loader";
export default function CrmLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader size={96}/>
    </div>
  );
}
