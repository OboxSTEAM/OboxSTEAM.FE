export const navigationMocks = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  searchParams: new URLSearchParams(),
};

export function resetNavigationMocks(): void {
  navigationMocks.push.mockReset();
  navigationMocks.replace.mockReset();
  navigationMocks.prefetch.mockReset();
  navigationMocks.back.mockReset();
  navigationMocks.forward.mockReset();
  navigationMocks.refresh.mockReset();
  navigationMocks.searchParams = new URLSearchParams();
}
