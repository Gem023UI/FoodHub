// ── API Base URL ────────────────────────────────────────────────────────
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ── Review Types ──────────────────────────────────────────────────────
export interface ProductReview {
  _id: string;
  orderId?: string;
  reviewEmail: string;
  reviewProfileUrl: string | null;
  rating: number;
  comment: string;
  reviewImages: string[];
  reviewDate: string;
}

export async function createReview(
  token: string,
  reviewData: {
    productId: string;
    orderId: string;
    rating: number;
    comment: string;
    images?: string[];
  }
): Promise<{ review: ProductReview }> {
  const response = await fetch(`${apiBaseUrl}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(reviewData),
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to create review");
  }
  return response.json();
}

export async function getReviewsByProduct(productId: string): Promise<ProductReview[]> {
  const response = await fetch(`${apiBaseUrl}/reviews/product/${productId}`);
  if (!response.ok) throw new Error("Failed to fetch reviews");
  const data = await response.json() as { reviews: ProductReview[] };
  return data.reviews;
}

export async function deleteReview(token: string, productId: string, reviewId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/reviews/${productId}/${reviewId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json() as { message?: string };
    throw new Error(data.message ?? "Failed to delete review");
  }
}

export async function uploadReviewImages(token: string, files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.slice(0, 5).forEach(file => formData.append("images", file));

  const response = await fetch(`${apiBaseUrl}/uploads/review`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(data.message ?? "Failed to upload review images");
  }
  const data = await response.json() as { urls: string[] };
  return data.urls;
}