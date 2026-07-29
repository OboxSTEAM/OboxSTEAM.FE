import { ParentProfileGate } from "@/components/parent/parent-profile-gate";
import { CurrentUserProvider } from "@/components/providers/current-user-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey="obox-theme"
      >
        <CurrentUserProvider>
          <TooltipProvider>
            {children}
            <ParentProfileGate />
            <Toaster />
          </TooltipProvider>
        </CurrentUserProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}
