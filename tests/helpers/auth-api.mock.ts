function mockJwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.test-signature`;
}

export const mockStudentAccessToken = mockJwt({ role: "Student" });

export const mockRegisteredUser = {
  id: "user-1",
  code: "STU001",
  fullName: "Nguyen Van A",
  email: "student@example.com",
  avatarUrl: null,
  phone: "0912345678",
  role: "Student",
  status: "Active",
  isEmailVerified: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};
