"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = exports.PaymentModel = exports.OrderHistoryModel = exports.OrderLineModel = void 0;
const mongoose_1 = require("mongoose");

// Order Line Schema - individual items in an order with nutrition data
const orderLineSchema = new mongoose_1.Schema({
  productId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  productName: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
  nutrition: {
    calories: { type: Number, default: null },
    protein: { type: Number, default: null },
    carbs: { type: Number, default: null },
    allergen: { type: String, default: "" }
  }
});

// Payment Record Schema
const paymentRecordSchema = new mongoose_1.Schema({
  orderId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Order",
    required: false,
    default: null
  },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["cash", "gcash", "paymaya"]
  },
  paymentReference: { type: String, required: true, unique: true },
  // ── Proof of payment (GCash / Maya) ─────────────────────────────────
  proofOfPaymentUrl: { type: String, trim: true, default: null },
  referenceNumber: { type: String, trim: true, default: null },
  status: {
    type: String,
    enum: ["pending", "paid", "refunded"],
    default: "pending"
  },
  paidAt: { type: Date, default: null }
}, { timestamps: true });

// Order History Schema - main order document
const orderHistorySchema = new mongoose_1.Schema({
  stallId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Stall",
    required: true,
    index: true
  },
  studentId: {
    type: mongoose_1.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true
  },
  course: { type: String, required: true, trim: true },
  orderLines: [orderLineSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  orderStatus: {
    type: String,
    enum: ["pending", "preparing", "ready", "completed", "cancelled"],
    default: "pending"
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["cash", "gcash", "paymaya"]
  },
  // ── Pickup time chosen by the student at checkout (e.g. "14:30") ─────
  pickupTime: { type: String, required: true, trim: true },
  paymentRecord: paymentRecordSchema
}, { timestamps: true });

// Indexes
orderHistorySchema.index({ studentId: 1, createdAt: -1 });
orderHistorySchema.index({ stallId: 1, createdAt: -1 });
orderHistorySchema.index({ orderStatus: 1 });
orderHistorySchema.index({ course: 1 });

const OrderLineModel = (0, mongoose_1.model)("OrderLine", orderLineSchema);
exports.OrderLineModel = OrderLineModel;
const OrderHistoryModel = (0, mongoose_1.model)("Order", orderHistorySchema);
exports.OrderHistoryModel = OrderHistoryModel;
const PaymentModel = (0, mongoose_1.model)("Payment", paymentRecordSchema);
exports.PaymentModel = PaymentModel;

exports.OrderModel = OrderHistoryModel;