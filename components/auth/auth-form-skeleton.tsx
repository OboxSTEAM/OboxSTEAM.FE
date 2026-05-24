export function AuthFormSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col animate-pulse gap-5">
      <div className="mx-auto h-8 w-48 rounded-lg bg-[#F3F4F6]" />
      <div className="mx-auto h-4 w-64 rounded bg-[#F3F4F6]" />
      <div className="mt-4 h-11 rounded-xl bg-[#F3F4F6]" />
      <div className="h-11 rounded-xl bg-[#F3F4F6]" />
      <div className="h-11 rounded-xl bg-[#2D2D2D]/20" />
    </div>
  );
}
