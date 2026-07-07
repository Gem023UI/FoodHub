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