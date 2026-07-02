// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ── User Types ────────────────────────────────────────────────────────
export interface StudentMe {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthday: string | null;
  tuptId: string;
  course: string;
  section: string;
  contactNumber: string | null;
  profilePictureUrl: string | null;
  status: "unverified" | "verified" | "deactivated";
  budgetCap: {
    amount: number | null;
    period: "daily" | "weekly" | "monthly";
  };
}

// ── User Functions ────────────────────────────────────────────────────
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