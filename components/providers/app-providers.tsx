import { ParentProfileGate } from "@/components/parent/parent-profile-gate";
import { CurrentUserProvider } from "@/components/providers/current-user-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import { ThemeAuthSync } from "@/components/providers/theme-auth-sync";
import { ThemeProvider } from "@/components/providers/theme-provider";
import {
  APP_THEME_DEFAULT,
  APP_THEME_STORAGE_KEY,
} from "@/lib/theme/constants";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme={APP_THEME_DEFAULT}
        enableSystem={false}
        storageKey={APP_THEME_STORAGE_KEY}
      >
        <ThemeAuthSync />
        <CurrentUserProvider>
          <NotificationProvider>
            <TooltipProvider>
              {children}
              <ParentProfileGate />
              <Toaster />
            </TooltipProvider>
          </NotificationProvider>
        </CurrentUserProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}
