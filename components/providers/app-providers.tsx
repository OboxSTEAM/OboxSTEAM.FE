import { ParentProfileGate } from "@/components/parent/parent-profile-gate";
import { CurrentUserProvider } from "@/components/providers/current-user-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <CurrentUserProvider>
        {children}
        <ParentProfileGate />
        <Toaster />
      </CurrentUserProvider>
    </StoreProvider>
  );
}
