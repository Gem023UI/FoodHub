// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ── Auth Types ─────────────────────────────────────────────────────────
export interface StudentRegisterInput {
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
  tuptId: string;
  course: string;
  section: string;
  contactNumber: string;
  password: string;
}

export interface VendorRegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber: string;
  proofOfLegitimacyUrl?: string;
  stallId: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    profilePictureUrl: string | null;
    stallId?: string;
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

export async function registerVendor(input: VendorRegisterInput): Promise<{ message: string; stallId: string }> {
  const response = await fetch(`${apiBaseUrl}/auth/register/vendor`, {
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

// ── Product Types ──────────────────────────────────────────────────────
export interface Product {
  _id: string;
  stallId: {
    _id: string;
    name: string;
    location: string;
    photos: string[];
  } | string;
  name: string;
  description: string;
  ingredients: string[];
  allergens: string[];
  nutrition: {
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatGrams: number | null;
    sodiumMilligrams: number | null;
  };
  price: number;
  photos: string[];
  category: string;
  isAvailable: boolean;
  isFeatured: boolean;
  favoriteCount: number;
  averageRating: number;
  reviewCount: number;
}

export interface Stall {
  _id: string;
  name: string;
  description: string;
  location: string;
  section: string;
  category: string;
  photos: string[];
  openingHours: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  status: string;
  vendorIds: string[];
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  averageProductRating: number;
}

export interface Review {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
    course: string;
  };
  stallId: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  photos: string[];
  isVisible: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  nutrition: {
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatGrams: number | null;
  };
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
  } | string;
  stallId: {
    _id: string;
    name: string;
    location: string;
    photos: string[];
  } | string;
  orderLines: OrderItem[];
  totalAmount: number;
  paymentMethod: "Cash" | "GCash" | "Maya";
  gcashNumber: string | null;
  pickupTime: string;
  orderStatus: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  paymentStatus: "Unpaid" | "Paid" | "Failed" | "Refunded";
  paymongoPaymentId: string | null;
  paymongoCheckoutUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Product Functions ──────────────────────────────────────────────────
// ── Product Functions ──────────────────────────────────────────────────
export async function getProductsByStall(stallId: string): Promise<Product[]> {
  if (!stallId) {
    console.error("❌ getProductsByStall: No stallId provided");
    return [];
  }
  
  try {
    const response = await fetch(`${apiBaseUrl}/stalls/${stallId}/products`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ Failed to fetch products: ${response.status}`, errorData);
      throw new Error(errorData.message || `Failed to fetch products: ${response.status}`);
    }
    
    const data = await response.json() as { products: Product[] };
    console.log(`✅ Fetched ${data.products?.length || 0} products for stall ${stallId}`);
    return data.products || [];
  } catch (error) {
    console.error("❌ Error in getProductsByStall:", error);
    return [];
  }
}

export async function getProductById(productId: string): Promise<Product> {
  const response = await fetch(`${apiBaseUrl}/stalls/menu-items/${productId}`);
  if (!response.ok) throw new Error("Failed to fetch product");
  const data = await response.json() as { menuItem: Product };
  return data.menuItem;
}

// ── Stall Functions ────────────────────────────────────────────────────
export async function getStalls(): Promise<Stall[]> {
  const response = await fetch(`${apiBaseUrl}/stalls`);
  if (!response.ok) throw new Error("Failed to fetch stalls");
  const data = await response.json() as { stalls: Stall[] };
  return data.stalls;
}

export async function getStallById(stallId: string): Promise<{ stall: Stall; products: Product[]; reviewSummary: { averageRating: number; reviewCount: number } }> {
  if (!stallId) {
    throw new Error("Stall ID is required");
  }
  
  const response = await fetch(`${apiBaseUrl}/stalls/${stallId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch stall: ${response.status}`);
  }
  return response.json();
}

export async function getAvailableStalls(): Promise<Stall[]> {
  const response = await fetch(`${apiBaseUrl}/stalls/available`);
  if (!response.ok) throw new Error("Failed to fetch available stalls");
  const data = await response.json() as { stalls: Stall[] };
  return data.stalls;
}

// ── Order Functions ────────────────────────────────────────────────────
export async function createOrder(
  token: string,
  orderData: {
    stallId: string;
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: "Cash" | "GCash" | "Maya";
    gcashNumber?: string;
    pickupTime: string;
  }
): Promise<{ order: Order }> {
  const response = await fetch(`${apiBaseUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to create order");
  }
  return response.json();
}

export async function getStudentOrders(token: string): Promise<Order[]> {
  const response = await fetch(`${apiBaseUrl}/orders/student`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch orders");
  const data = await response.json() as { orders: Order[] };
  return data.orders;
}

export async function getVendorOrders(token: string): Promise<Order[]> {
  const response = await fetch(`${apiBaseUrl}/orders/vendor`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch orders");
  const data = await response.json() as { orders: Order[] };
  return data.orders;
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  status: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled"
): Promise<{ order: Order }> {
  const response = await fetch(`${apiBaseUrl}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to update order status");
  }
  return response.json();
}

// ── Review Functions ───────────────────────────────────────────────────
export async function createReview(
  token: string,
  reviewData: {
    stallId: string;
    productId: string;
    rating: number;
    comment: string;
    photos?: string[];
  }
): Promise<{ review: Review }> {
  const response = await fetch(`${apiBaseUrl}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reviewData),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to create review");
  }
  return response.json();
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const response = await fetch(`${apiBaseUrl}/reviews/product/${productId}`);
  if (!response.ok) throw new Error("Failed to fetch reviews");
  const data = await response.json() as { reviews: Review[] };
  return data.reviews;
}

// ── Favorite Functions ─────────────────────────────────────────────────
export async function toggleFavorite(token: string, productId: string): Promise<{ isFavorited: boolean }> {
  const response = await fetch(`${apiBaseUrl}/favorites/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId }),
  });
  if (!response.ok) throw new Error("Failed to toggle favorite");
  return response.json();
}

export async function getFavorites(token: string): Promise<Product[]> {
  const response = await fetch(`${apiBaseUrl}/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch favorites");
  const data = await response.json() as { favorites: Product[] };
  return data.favorites;
}