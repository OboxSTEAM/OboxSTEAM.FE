import { StoreProvider } from "@/components/providers/store-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      {children}
      <Toaster />
    </StoreProvider>
  );
}
