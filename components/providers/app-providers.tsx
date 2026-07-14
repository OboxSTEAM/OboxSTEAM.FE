import { ParentProfileGate } from "@/components/parent/parent-profile-gate";
import { CurrentUserProvider } from "@/components/providers/current-user-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <CurrentUserProvider>
        <TooltipProvider>
          {children}
          <ParentProfileGate />
          <Toaster />
        </TooltipProvider>
      </CurrentUserProvider>
    </StoreProvider>
  );
}
