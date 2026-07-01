"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = exports.PaymentModel = exports.OrderHistoryModel = exports.OrderLineModel = void 0;
const mongoose_1 = require("mongoose");

// Order Line Schema - individual items in an order
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
        proteinGrams: { type: Number, default: null },
        carbsGrams: { type: Number, default: null },
        fatGrams: { type: Number, default: null }
    }
});

// Order History Schema - main order document
const orderHistorySchema = new mongoose_1.Schema({
    studentId: { 
        type: mongoose_1.Schema.Types.ObjectId, 
        ref: "Student", 
        required: true,
        index: true 
    },
    stallId: { 
        type: mongoose_1.Schema.Types.ObjectId, 
        ref: "Stall", 
        required: true,
        index: true 
    },
    orderLines: [orderLineSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { 
        type: String, 
        required: true, 
        enum: ["Cash", "GCash", "Maya"] 
    },
    gcashNumber: { type: String, default: null },
    pickupTime: { type: String, required: true },
    orderStatus: {
        type: String,
        enum: ["Pending", "Preparing", "Ready", "Completed", "Cancelled"],
        default: "Pending"
    },
    paymentStatus: {
        type: String,
        enum: ["Unpaid", "Paid", "Failed", "Refunded"],
        default: "Unpaid"
    },
    paymongoPaymentId: { type: String, default: null },
    paymongoCheckoutUrl: { type: String, default: null }
}, { timestamps: true });

// Payment Schema - tracks payment details
const paymentSchema = new mongoose_1.Schema({
    orderId: { 
        type: mongoose_1.Schema.Types.ObjectId, 
        ref: "Order", 
        required: true,
        unique: true,
        index: true 
    },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { 
        type: String, 
        required: true, 
        enum: ["GCash", "Maya"] 
    },
    paymentReference: { type: String, required: true, unique: true },
    paymongoPaymentId: { type: String, required: true, unique: true },
    paymongoCheckoutId: { type: String, required: true },
    status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending"
    },
    paidAt: { type: Date, default: null },
    webhookData: { type: mongoose_1.Schema.Types.Mixed, default: null }
}, { timestamps: true });

// Indexes
orderHistorySchema.index({ studentId: 1, createdAt: -1 });
orderHistorySchema.index({ stallId: 1, createdAt: -1 });
orderHistorySchema.index({ orderStatus: 1, paymentStatus: 1 });
orderHistorySchema.index({ "orderLines.productId": 1 });

const OrderLineModel = (0, mongoose_1.model)("OrderLine", orderLineSchema);
exports.OrderLineModel = OrderLineModel;
const OrderHistoryModel = (0, mongoose_1.model)("Order", orderHistorySchema);
exports.OrderHistoryModel = OrderHistoryModel;
const PaymentModel = (0, mongoose_1.model)("Payment", paymentSchema);
exports.PaymentModel = PaymentModel;

// Export Order model as the main model for compatibility
exports.OrderModel = OrderHistoryModel;