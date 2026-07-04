// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ── Auth Types ─────────────────────────────────────────────────────────
export interface StudentRegisterInput {
  firstName: string;
  lastName: string;
  birthdate: string;
  email: string;
  tuptId: string;
  course: string;
  section: string;
  contactNumber: string;
  password: string;
  profilePictureUrl?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    profilePictureUrl: string | null;
    isActive: boolean;
    status: string;
    stallId?: string;
    stallName?: string;
    position?: string;
  };
}

// ── Auth Functions ─────────────────────────────────────────────────────
export async function registerStudent(input: StudentRegisterInput): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/auth/register/student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Registration failed");
  }
  return response.json();
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Login failed");
  }
  return response.json();
}

export async function logoutUser(token: string): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Logout failed");
  return response.json();
}

export async function verifyEmail(email: string, code: string): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Verification failed");
  }
  return response.json();
}

export async function resendVerification(email: string): Promise<{ message: string; remainingSeconds?: number }> {
  const response = await fetch(`${apiBaseUrl}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string; remainingSeconds?: number };
    throw new Error(data.message ?? "Failed to resend code");
  }
  return response.json();
}

export async function getMe(token: string): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}

export async function updateMyProfile(token: string, userId: string, updates: Record<string, unknown>) {
  const response = await fetch(`${apiBaseUrl}/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message ?? "Failed to update profile");
  }
  return response.json();
}

export async function uploadStudentPicture(token: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("profile", file);
  const response = await fetch(`${apiBaseUrl}/users/profile/student`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to upload picture");
  return response.json();
}

export async function uploadVendorPicture(token: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("profile", file);
  const response = await fetch(`${apiBaseUrl}/users/profile/vendor`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to upload picture");
  return response.json();
}