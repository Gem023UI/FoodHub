"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.getStudentOrders = getStudentOrders;
exports.getVendorOrders = getVendorOrders;
exports.updateOrderStatus = updateOrderStatus;
exports.updatePaymentStatus = updatePaymentStatus;
exports.getOrderById = getOrderById;
exports.calculateOrderTotal = calculateOrderTotal;

const models_1 = require("../models");

// ── CREATE ORDER ──────────────────────────────────────────────────────────
async function createOrder(data) {
    const { studentId, stallId, items, paymentMethod, gcashNumber, pickupTime } = data;

    // Validate stall
    const stall = await models_1.StallModel.findById(stallId);
    if (!stall) {
        return { success: false, reason: "stall_not_found" };
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const orderLines = [];

    for (const item of items) {
        const product = await models_1.ProductModel.findById(item.productId);
        if (!product) {
            return { success: false, reason: "product_not_found", productId: item.productId };
        }
        if (!product.isAvailable) {
            return { success: false, reason: "product_unavailable", productName: product.name };
        }

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        orderLines.push({
            productId: product._id,
            productName: product.name,
            price: product.price,
            quantity: item.quantity,
            subtotal,
            nutrition: product.nutrition || {}
        });
    }

    // Create order
    const order = await models_1.OrderModel.create({
        studentId,
        stallId,
        orderLines,
        totalAmount,
        paymentMethod,
        gcashNumber: paymentMethod === "GCash" ? gcashNumber : null,
        pickupTime,
        orderStatus: "Pending",
        paymentStatus: "Unpaid"
    });

    return {
        success: true,
        data: {
            order: order.toObject()
        }
    };
}

// ── GET STUDENT ORDERS ──────────────────────────────────────────────────
async function getStudentOrders(studentId) {
    return models_1.OrderModel.find({ studentId })
        .populate("stallId", "name location photos")
        .sort({ createdAt: -1 })
        .lean();
}

// ── GET VENDOR ORDERS ──────────────────────────────────────────────────
async function getVendorOrders(vendorId) {
    // Get vendor's stall
    const vendor = await models_1.VendorModel.findById(vendorId).select("stallId");
    if (!vendor || !vendor.stallId) {
        return [];
    }

    return models_1.OrderModel.find({ stallId: vendor.stallId })
        .populate("studentId", "firstName lastName email tuptId course section")
        .populate("stallId", "name location")
        .sort({ createdAt: -1 })
        .lean();
}

// ── GET ORDER BY ID ──────────────────────────────────────────────────────
async function getOrderById(orderId) {
    return models_1.OrderModel.findById(orderId)
        .populate("studentId", "firstName lastName email tuptId course section")
        .populate("stallId", "name location photos")
        .lean();
}

// ── UPDATE ORDER STATUS (Vendor only) ──────────────────────────────────
async function updateOrderStatus(orderId, status, vendorId) {
    const order = await models_1.OrderModel.findById(orderId);
    if (!order) {
        return { success: false, reason: "order_not_found" };
    }

    // Verify vendor owns the stall
    const vendor = await models_1.VendorModel.findById(vendorId).select("stallId");
    if (!vendor || vendor.stallId.toString() !== order.stallId.toString()) {
        return { success: false, reason: "unauthorized" };
    }

    // Can't update if order is completed or cancelled
    if (order.orderStatus === "Completed" || order.orderStatus === "Cancelled") {
        return { success: false, reason: "order_finalized" };
    }

    // Can't update if payment is unpaid (except for cancellation)
    if (order.paymentStatus !== "Paid" && status !== "Cancelled") {
        return { success: false, reason: "payment_required" };
    }

    const updated = await models_1.OrderModel.findByIdAndUpdate(orderId, {
        $set: { orderStatus: status }
    }, { new: true }).lean();

    // If status is completed, update stall revenue
    if (status === "Completed") {
        await updateStallRevenue(order.stallId, order.totalAmount);
    }

    return { success: true, data: { order: updated } };
}

// ── UPDATE PAYMENT STATUS ──────────────────────────────────────────────
async function updatePaymentStatus(orderId, paymentStatus, paymongoData) {
    const order = await models_1.OrderModel.findById(orderId);
    if (!order) {
        return { success: false, reason: "order_not_found" };
    }

    const updateData = {
        paymentStatus: paymentStatus
    };

    if (paymongoData) {
        updateData.paymongoPaymentId = paymongoData.paymentId;
        updateData.paymongoCheckoutUrl = paymongoData.checkoutUrl;
    }

    // If payment is successful, update order status to Pending Preparation
    if (paymentStatus === "Paid") {
        updateData.orderStatus = "Pending";
    }

    const updated = await models_1.OrderModel.findByIdAndUpdate(orderId, {
        $set: updateData
    }, { new: true }).lean();

    // If payment is successful, create payment record
    if (paymentStatus === "Paid" && paymongoData) {
        await models_1.PaymentModel.create({
            orderId: order._id,
            amount: order.totalAmount,
            paymentMethod: order.paymentMethod === "GCash" ? "GCash" : "Maya",
            paymentReference: paymongoData.paymentReference || paymongoData.paymentId,
            paymongoPaymentId: paymongoData.paymentId,
            paymongoCheckoutId: paymongoData.checkoutId,
            status: "Paid",
            paidAt: new Date()
        });
    }

    return { success: true, data: { order: updated } };
}

// ── UPDATE STALL REVENUE ────────────────────────────────────────────────
async function updateStallRevenue(stallId, amount) {
    const stall = await models_1.StallModel.findById(stallId);
    if (!stall) return;

    // Update revenue counters
    const updates = {
        $inc: { 
            dailyRevenue: amount,
            weeklyRevenue: amount,
            monthlyRevenue: amount
        },
        $push: {
            revenueHistory: {
                date: new Date(),
                amount: amount,
                period: "daily"
            }
        }
    };

    await models_1.StallModel.findByIdAndUpdate(stallId, updates);
}

// ── CALCULATE ORDER TOTAL ──────────────────────────────────────────────
function calculateOrderTotal(items) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}