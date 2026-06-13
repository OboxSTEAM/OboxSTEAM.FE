import { Skeleton } from "@/components/ui/skeleton";

export function PaymentInvoiceSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white shadow-sm">
      <div className="border-b border-[#E5E5E0] bg-[#FAFAF5] px-8 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <div className="space-y-0 px-8 py-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex justify-between gap-4 border-b border-[#E5E5E0] py-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
      <div className="border-t border-[#E5E5E0] bg-[#FAFAF5] px-8 py-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-10 w-44" />
      </div>
      <div className="border-t border-[#E5E5E0] px-8 py-5">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
