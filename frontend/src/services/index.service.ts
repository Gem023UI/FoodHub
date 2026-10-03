export const apiBaseUrl = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api`;
// ── Export all API modules ─────────────────────────────────────────────
export * from './auth.service';
export * from './product.service';
export * from './stall.service';
export * from './order.service';
export * from './favorite.service';
export * from './review.service';
export * from './budget.service';
export * from './report.service';
export * from './user.service';

// ── Resolve duplicate names (explicit exports override `export *`) ─────
export {
  getMe,
  updateMyProfile,
  uploadStudentPicture,
  uploadVendorPicture,
} from './auth.service';
export { getSpendingAnalytics } from './report.service';
export { getStallOrders } from './order.service';
export type { StudentMe } from './user.service';
export type { SpendingAnalytics } from './report.service';
export type { ProductReview } from './review.service';