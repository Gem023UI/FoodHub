export interface StallSummary {
  _id: string;
  name: string;
  location: string;
  category: string;
  photoUrl?: string | null;
  isActive: boolean;
  description?: string;
  openingHours?: string;
  vendorId?: {
    name: string;
    email: string;
  } | string;
}



export interface MenuItemSummary {
  _id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  description?: string;
  ingredients?: string[];
  allergens?: string[];
  nutrition?: {
    calories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    sodiumMilligrams?: number;
  };
  photoUrl?: string | null;
}



export interface ReviewSummary {

  averageRating: number;

  reviewCount: number;

}



export interface StallsResponse {

  stalls: StallSummary[];

}



const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";



async function request<T>(path: string, token?: string): Promise<T> {

  const headers: Record<string, string> = {};

  if (token) {

    headers["Authorization"] = `Bearer ${token}`;

  }



  const response = await fetch(`${apiBaseUrl}${path}`, { headers });



  if (!response.ok) {

    throw new Error(`Request failed with status ${response.status}`);

  }



  return response.json() as Promise<T>;

}



export async function fetchStalls(token?: string): Promise<StallSummary[]> {

  const result = await request<StallsResponse>("/stalls", token);

  return result.stalls;

}



export async function fetchStallDetails(

  stallId: string,

  token?: string

): Promise<{

  stall: StallSummary;

  menuItems: MenuItemSummary[];

  reviewSummary: ReviewSummary;

}> {

  return request(`/stalls/${stallId}`, token);
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderSummary {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    contactNumber?: string | null;
    studentId?: string | null;
    courseSection?: string | null;
    schoolEmail?: string | null;
  } | string;
  stallId: {
    _id: string;
    name: string;
  } | string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: "Cash" | "GCash";
  gcashNumber?: string | null;
  pickupTime: string;
  status: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  paymentStatus: "Unpaid" | "Paid";
  createdAt: string;
  updatedAt: string;
}

export async function placePreOrder(
  token: string,
  orderInput: {
    stallId: string;
    items: Array<{ menuItemId: string; quantity: number }>;
    paymentMethod: "Cash" | "GCash";
    gcashNumber?: string;
    pickupTime: string;
  }
): Promise<{ order: OrderSummary }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const response = await fetch(`${apiBaseUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(orderInput)
  });
  if (!response.ok) {
    const errData = await response.json() as { message?: string };
    throw new Error(errData.message ?? "Failed to place pre-order");
  }
  return response.json() as Promise<{ order: OrderSummary }>;
}

export async function fetchStudentOrders(token: string): Promise<OrderSummary[]> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const response = await fetch(`${apiBaseUrl}/orders/student`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error("Failed to fetch student orders");
  }
  const data = await response.json() as { orders: OrderSummary[] };
  return data.orders;
}

export async function fetchVendorOrders(token: string): Promise<OrderSummary[]> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const response = await fetch(`${apiBaseUrl}/orders/vendor`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error("Failed to fetch vendor orders");
  }
  const data = await response.json() as { orders: OrderSummary[] };
  return data.orders;
}

export async function updateOrderStatusAPI(
  token: string,
  orderId: string,
  statusUpdate: {
    status?: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
    paymentStatus?: "Unpaid" | "Paid";
  }
): Promise<{ order: OrderSummary }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const response = await fetch(`${apiBaseUrl}/orders/${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(statusUpdate)
  });
  if (!response.ok) {
    throw new Error("Failed to update order status");
  }
  return response.json() as Promise<{ order: OrderSummary }>;
}

export interface ReportSummary {
  _id: string;
  reporterId: {
    _id: string;
    name: string;
    email: string;
  };
  reportedUserId: {
    _id: string;
    name: string;
    email: string;
    studentId?: string | null;
    courseSection?: string | null;
    schoolEmail?: string | null;
    contactNumber?: string | null;
    status: "Active" | "Suspended" | "Pending";
    isActive: boolean;
  };
  orderId?: {
    _id: string;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    gcashNumber?: string | null;
  } | null;
  reason: "No-show / Unclaimed order" | "Fake / Duplicate GCash payment" | "Abusive behavior / Language" | "Other";
  description: string;
  status: "Pending" | "Resolved" | "Dismissed";
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export async function submitReport(
  token: string,
  reportData: {
    reportedUserId: string;
    orderId?: string | null;
    reason: string;
    description: string;
  }
): Promise<{ report: ReportSummary }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const response = await fetch(`${apiBaseUrl}/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(reportData)
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to submit report");
  }
  return response.json() as Promise<{ report: ReportSummary }>;
}

export async function fetchReports(token: string, status?: string): Promise<ReportSummary[]> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const url = status ? `${apiBaseUrl}/reports?status=${status}` : `${apiBaseUrl}/reports`;
  const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error("Failed to fetch reports");
  }
  const data = await response.json() as { reports: ReportSummary[] };
  return data.reports;
}

export async function updateReport(
  token: string,
  reportId: string,
  updateData: {
    status: "Pending" | "Resolved" | "Dismissed";
    adminNotes?: string;
    suspendUser?: boolean;
  }
): Promise<{ report: ReportSummary }> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const response = await fetch(`${apiBaseUrl}/reports/${reportId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to update report");
  }
  return response.json() as Promise<{ report: ReportSummary }>;
}