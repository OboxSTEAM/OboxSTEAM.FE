import React from "react";
import "@testing-library/jest-dom";

process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";

jest.mock("next/navigation", () => {
  const { navigationMocks } = require("./tests/helpers/navigation-mocks");
  return {
    useRouter: () => ({
      push: navigationMocks.push,
      replace: navigationMocks.replace,
      prefetch: navigationMocks.prefetch,
      back: navigationMocks.back,
      forward: navigationMocks.forward,
      refresh: navigationMocks.refresh,
    }),
    usePathname: () => "/",
    useSearchParams: () => navigationMocks.searchParams,
    useParams: () => ({}),
    redirect: jest.fn(),
    notFound: jest.fn(),
  };
});

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href, ...rest }, children),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    message: jest.fn(),
  },
  Toaster: () => null,
}));

jest.mock("@/lib/errors", () => {
  const actual = jest.requireActual("@/lib/errors");
  return {
    ...actual,
    showAppSuccess: jest.fn(),
    showAppErrorFromUnknown: jest.fn(),
    showAppError: jest.fn(),
  };
});

jest.mock("@/lib/api/account", () => ({
  updateProfile: jest.fn(async (input: { fullName: string; phone: string }) => {
    const { mockUserProfile } = require("./tests/helpers/profile-api.mock");
    return {
      code: "OK",
      message: "Cap nhat ho so thanh cong",
      data: {
        ...mockUserProfile,
        fullName: input.fullName,
        phone: input.phone,
      },
    };
  }),
}));

jest.mock("@/lib/api/portfolios", () => ({
  createPortfolioItem: jest.fn(async (input: { title: string }) => {
    const { mockPortfolioItem } = require("./tests/helpers/profile-api.mock");
    return {
      code: "OK",
      message: "Da them muc",
      data: {
        ...mockPortfolioItem,
        title: input.title,
      },
    };
  }),
  updatePortfolioItem: jest.fn(async (_id: string, input: { title?: string | null }) => {
    const { mockPortfolioItem } = require("./tests/helpers/profile-api.mock");
    return {
      code: "OK",
      message: "Da cap nhat muc",
      data: {
        ...mockPortfolioItem,
        title: input.title ?? mockPortfolioItem.title,
      },
    };
  }),
}));

jest.mock("@/lib/api", () => {
  const { ApiResponseError } = jest.requireActual("@/lib/api/errors");
  const {
    mockRegisteredUser,
    mockStudentAccessToken,
  } = require("./tests/helpers/auth-api.mock");
  const {
    mockParentProfile,
    mockUserProfile,
  } = require("./tests/helpers/profile-api.mock");

  return {
    login: jest.fn(async (input: { email: string; password: string }) => {
      if (input.email === "fail@example.com") {
        throw new ApiResponseError("Invalid credentials", "AUTH_FAILED");
      }

      return {
        code: "OK",
        message: "Dang nhap thanh cong",
        data: {
          accessToken: mockStudentAccessToken,
          refreshToken: "refresh-token",
        },
      };
    }),
    register: jest.fn(async () => ({
      code: "OK",
      message: "Dang ky thanh cong",
      data: mockRegisteredUser,
    })),
    verifyOtp: jest.fn(async () => ({
      code: "OK",
      message: "Xac thuc thanh cong",
    })),
    sendResetLink: jest.fn(async () => ({
      code: "OK",
      message: "Da gui lien ket dat lai mat khau",
    })),
    forgotPassword: jest.fn(async () => ({
      code: "OK",
      message: "Dat lai mat khau thanh cong",
    })),
    getParentLinks: jest.fn(async () => ({
      code: "OK",
      message: "OK",
      data: [],
    })),
    requestParentLink: jest.fn(async () => ({
      code: "OK",
      message: "Da gui lien ket xac nhan",
    })),
    completeParentProfile: jest.fn(async (input: {
      fullName: string;
      phone: string;
      password: string;
    }) => ({
      code: "OK",
      message: "Hoan tat ho so thanh cong",
      data: {
        ...mockParentProfile,
        fullName: input.fullName,
        phone: input.phone,
      },
    })),
  };
});

const { resetNavigationMocks } = require("./tests/helpers/navigation-mocks");

afterEach(() => {
  resetNavigationMocks();
  jest.clearAllMocks();
});
