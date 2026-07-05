// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ── Order Types ────────────────────────────────────────────────────────
export interface OrderLine {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  nutrition?: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    allergen: string;
  };
}

export interface PaymentRecord {
  orderId: string;
  totalAmount: number;
  paymentMethod: "cash" | "gcash" | "paymaya";
  paymentReference: string;
  proofOfPaymentUrl: string | null;
  referenceNumber: string | null;
  status: "pending" | "paid" | "refunded";
  paidAt: string | null;
}

export interface Order {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    tuptId: string;
    course: string;
    section: string;
    profilePictureUrl: string | null;
  } | string;
  stallId: {
    _id: string;
    stallName: string;
    stallPicture: string | null;
    section: number;
  } | string;
  course: string;
  orderLines: OrderLine[];
  totalAmount: number;
  orderStatus: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  paymentMethod: "cash" | "gcash" | "paymaya";
  pickupTime: string;
  paymentRecord: PaymentRecord;
  createdAt: string;
  updatedAt: string;
}

export class OverBudgetError extends Error {
  currentBudget: number;
  totalAmount: number;
  constructor(message: string, currentBudget: number, totalAmount: number) {
    super(message);
    this.name = "OverBudgetError";
    this.currentBudget = currentBudget;
    this.totalAmount = totalAmount;
  }
}

export class PickupTimeOutsideHoursError extends Error {
  openTime: string;
  closingTime: string;
  constructor(message: string, openTime: string, closingTime: string) {
    super(message);
    this.name = "PickupTimeOutsideHoursError";
    this.openTime = openTime;
    this.closingTime = closingTime;
  }
}

export class StallClosedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StallClosedError";
  }
}

// ── Order Functions ────────────────────────────────────────────────────
export async function createOrder(
  token: string,
  orderData: {
    stallId: string;
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: "cash" | "gcash" | "paymaya";
    pickupTime: string;
    referenceNumber?: string;
    proofOfPaymentUrl?: string;
    confirmOverBudget?: boolean;
  }
): Promise<{ order: Order; currentBudget: number | null }> {
  const response = await fetch(`${apiBaseUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(orderData),
  });

  if (response.status === 409) {
    const data = await response.json() as { message?: string; currentBudget: number; totalAmount: number };
    throw new OverBudgetError(
      data.message ?? "This order exceeds your current budget.",
      data.currentBudget,
      data.totalAmount
    );
  }

  if (response.status === 422) {
    const data = await response.json() as { message?: string; openTime: string; closingTime: string };
    throw new PickupTimeOutsideHoursError(
      data.message ?? "Pickup time is outside the stall's open hours.",
      data.openTime,
      data.closingTime
    );
  }

  if (response.status === 403) {
    const data = await response.json() as { message?: string };
    throw new StallClosedError(data.message ?? "This stall is currently closed.");
  }

  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to create order");
  }
  return response.json();
}

// ── Upload proof of payment (GCash / Maya) ──────────────────────────────
export async function uploadPaymentProof(token: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("proof", file);

  const response = await fetch(`${apiBaseUrl}/uploads/payment-proof`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(data.message ?? "Failed to upload payment proof");
  }
  const data = await response.json() as { url: string };
  return data.url;
}

export async function getStudentOrders(token: string): Promise<Order[]> {
  const response = await fetch(`${apiBaseUrl}/orders/student`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch orders");
  const data = await response.json() as { orders: Order[] };
  return data.orders;
}

export async function getStudentOrdersWithDateRange(
  token: string, 
  startDate?: string, 
  endDate?: string
): Promise<Order[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const url = `${apiBaseUrl}/orders/student/range${params.toString() ? `?${params.toString()}` : ''}`;
  
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      throw new Error(`Failed to fetch orders: ${response.status}`);
    }
    
    const data = await response.json() as { orders: Order[] };
    return data.orders;
  } catch (error) {
    console.error("❌ Error in getStudentOrdersWithDateRange:", error);
    return getStudentOrders(token);
  }
}

export async function getStallOrders(token: string, stallId: string, status?: string): Promise<Order[]> {
  const params = status ? `?status=${status}` : '';
  const response = await fetch(`${apiBaseUrl}/orders/stall/${stallId}${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch stall orders");
  const data = await response.json() as { orders: Order[] };
  return data.orders;
}

export async function getOrderById(token: string, orderId: string): Promise<Order> {
  const response = await fetch(`${apiBaseUrl}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch order");
  const data = await response.json() as { order: Order };
  return data.order;
}

export async function updateOrderStatus(token: string, orderId: string, status: "pending" | "preparing" | "ready" | "completed" | "cancelled"): Promise<{ order: Order }> {
  const response = await fetch(`${apiBaseUrl}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to update order status");
  }
  return response.json();
}

export async function updatePaymentStatus(
  token: string,
  orderId: string,
  paymentStatus: "pending" | "paid" | "refunded",
  paymentData?: any
): Promise<{ order: Order }> {
  const response = await fetch(`${apiBaseUrl}/orders/${orderId}/payment`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ paymentStatus, paymentData }),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to update payment status");
  }
  return response.json();
}