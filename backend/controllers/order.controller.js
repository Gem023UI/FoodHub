"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.getStudentOrders = getStudentOrders;
exports.getStallOrders = getStallOrders;
exports.getOrderById = getOrderById;
exports.updateOrderStatus = updateOrderStatus;
exports.updatePaymentStatus = updatePaymentStatus;
exports.checkBudgetCapAndNotify = checkBudgetCapAndNotify;
exports.calculateOrderTotal = calculateOrderTotal;

const models_1 = require("../models");
const mailer_1 = require("../utils/mailer");
const mongoose_1 = require("mongoose");

// ── CREATE ORDER ──────────────────────────────────────────────────────────
async function createOrder(data) {
    const { studentId, stallId, items, paymentMethod } = data;

    // Validate required fields
    if (!stallId || !items || !items.length || !paymentMethod) {
        return { success: false, reason: "missing_required_fields" };
    }

    const stall = await models_1.StallModel.findById(stallId);
    if (!stall) return { success: false, reason: "stall_not_found" };

    const student = await models_1.StudentModel.findById(studentId);
    if (!student) return { success: false, reason: "student_not_found" };

    let totalAmount = 0;
    const orderLines = [];

    for (const item of items) {
        // Find product in stall's products array
        const product = stall.products.find(p => p._id.toString() === item.productId);
        if (!product) return { success: false, reason: "product_not_found", productId: item.productId };
        if (!product.available) return { success: false, reason: "product_unavailable", productName: product.productName };
        if (product.stocks < item.quantity) return { success: false, reason: "insufficient_stock", productName: product.productName };

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        // Include nutrition data from the product
        const nutrition = product.nutrition || {};
        
        orderLines.push({
            productId: product._id,
            productName: product.productName,
            price: product.price,
            quantity: item.quantity,
            subtotal,
            nutrition: {
                calories: nutrition.calories || null,
                protein: nutrition.protein || null,
                carbs: nutrition.carbs || null,
                allergen: nutrition.allergen || ""
            }
        });

        product.stocks -= item.quantity;
    }

    await stall.save();

    // Generate a new ObjectId for the order
    const orderId = new mongoose_1.Types.ObjectId();

    // Get the count of existing orders for this student to determine order number
    const existingOrdersCount = await models_1.OrderModel.countDocuments({ studentId });
    const orderNumber = existingOrdersCount + 1;

    // Create the order with a proper ObjectId for paymentRecord
    const order = await models_1.OrderModel.create({
        _id: orderId,
        studentId,
        stallId,
        course: student.course,
        orderLines,
        totalAmount,
        orderStatus: "pending",
        paymentMethod,
        orderNumber: orderNumber, // Add this field
        paymentRecord: {
            orderId: orderId,
            totalAmount,
            paymentMethod,
            paymentReference: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            status: "pending"
        }
    });

    // Populate the order before returning
    const populatedOrder = await models_1.OrderModel.findById(order._id)
        .populate("studentId", "firstName lastName email tuptId course section profilePictureUrl")
        .populate("stallId", "stallName stallPicture section");

    // Budget cap check
    await checkBudgetCapAndNotify(studentId, totalAmount);

    return { success: true, data: { order: populatedOrder.toObject() } };
}

// ── BUDGET CAP CHECK ─────────────────────────────────────────────────────
async function checkBudgetCapAndNotify(studentId, orderTotal) {
    const student = await models_1.StudentModel.findById(studentId).select("email budgetCap");
    if (!student || !student.budgetCap || student.budgetCap.length === 0) return;

    // Check active budget caps
    const now = new Date();
    for (const budget of student.budgetCap) {
        if (budget.status !== "active") continue;
        if (budget.startDate > now || budget.endDate < now) continue;

        const { amount: capAmount, period } = budget;
        let sinceDate;
        
        if (period === "daily") {
            sinceDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === "weekly") {
            sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === "monthly") {
            sinceDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === "custom") {
            sinceDate = budget.startDate;
        }

        const periodOrders = await models_1.OrderModel.find({
            studentId,
            createdAt: { $gte: sinceDate },
            orderStatus: { $ne: "cancelled" }
        }).select("totalAmount");

        const periodSpent = periodOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        if (periodSpent > capAmount) {
            try {
                await (0, mailer_1.sendBudgetCapEmail)(student.email, {
                    capAmount, 
                    period, 
                    orderTotal, 
                    periodSpent,
                    startDate: sinceDate,
                    endDate: now
                });
            } catch (error) {
                console.error("Failed to send budget cap email:", error);
            }
        }
    }
}

// ── GET STUDENT ORDERS ──────────────────────────────────────────────────
async function getStudentOrders(studentId) {
    return models_1.OrderModel.find({ studentId })
        .populate("stallId", "stallName stallPicture section")
        .sort({ createdAt: 1 }) // Sort ascending (oldest first)
        .lean();
}

// ── GET STALL ORDERS ──────────────────────────────────────────────────
async function getStallOrders(stallId) {
    return models_1.OrderModel.find({ stallId })
        .populate("studentId", "firstName lastName email tuptId course section")
        .sort({ createdAt: 1 }) // Sort ascending (oldest first)
        .lean();
}

// ── GET ORDER BY ID ──────────────────────────────────────────────────────
async function getOrderById(orderId) {
    return models_1.OrderModel.findById(orderId)
        .populate("studentId", "firstName lastName email tuptId course section profilePictureUrl")
        .populate("stallId", "stallName stallPicture section")
        .lean();
}

// ── UPDATE ORDER STATUS (Vendor only) ──────────────────────────────────
async function updateOrderStatus(orderId, status, vendorEmail) {
    const order = await models_1.OrderModel.findById(orderId);
    if (!order) return { success: false, reason: "order_not_found" };

    // Verify vendor belongs to this stall
    const stall = await models_1.StallModel.findOne({
        _id: order.stallId,
        "vendors.email": vendorEmail
    });
    if (!stall) return { success: false, reason: "unauthorized" };

    if (order.orderStatus === "completed" || order.orderStatus === "cancelled") {
        return { success: false, reason: "order_finalized" };
    }

    const updated = await models_1.OrderModel.findByIdAndUpdate(orderId, {
        $set: { orderStatus: status }
    }, { new: true }).lean();

    return { success: true, data: { order: updated } };
}

// ── UPDATE PAYMENT STATUS ──────────────────────────────────────────────
async function updatePaymentStatus(orderId, paymentStatus, paymentData) {
    const order = await models_1.OrderModel.findById(orderId);
    if (!order) return { success: false, reason: "order_not_found" };

    const updateData = { 
        "paymentRecord.status": paymentStatus,
        "paymentRecord.paidAt": paymentStatus === "paid" ? new Date() : null
    };

    if (paymentData) {
        updateData["paymentRecord.paymongoPaymentId"] = paymentData.paymentId;
        updateData["paymentRecord.paymongoCheckoutId"] = paymentData.checkoutId;
        updateData["paymentRecord.paymongoCheckoutUrl"] = paymentData.checkoutUrl;
        updateData["paymentRecord.paymentReference"] = paymentData.paymentReference || `PAY-${Date.now()}`;
    }

    if (paymentStatus === "paid") {
        updateData.orderStatus = "pending";
    }

    const updated = await models_1.OrderModel.findByIdAndUpdate(orderId, {
        $set: updateData
    }, { new: true }).lean();

    return { success: true, data: { order: updated } };
}

// ── CALCULATE ORDER TOTAL ──────────────────────────────────────────────
function calculateOrderTotal(items) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}