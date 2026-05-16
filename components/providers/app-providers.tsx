import { StoreProvider } from "@/components/providers/store-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
