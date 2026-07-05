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
    const { studentId, stallId, items, paymentMethod, confirmOverBudget, pickupTime, referenceNumber, proofOfPaymentUrl } = data;

    // Validate required fields
    if (!stallId || !items || !items.length || !paymentMethod || !pickupTime) {
        return { success: false, reason: "missing_required_fields" };
    }

    // GCash / Maya require proof of payment + a reference number
    if ((paymentMethod === "gcash" || paymentMethod === "paymaya") && (!referenceNumber || !proofOfPaymentUrl)) {
        return { success: false, reason: "missing_payment_proof" };
    }

    const stall = await models_1.StallModel.findById(stallId);
    if (!stall) return { success: false, reason: "stall_not_found" };

    // ── Stall open/closed check ─────────────────────────────────────────
    if (!stall.status) {
        return { success: false, reason: "stall_closed" };
    }

    // ── Pickup time must be within stall's open hours ───────────────────
    if (stall.openHours && stall.openHours.openTime && stall.openHours.closingTime) {
        const toMinutes = (t) => {
            const [h, m] = t.split(":").map(Number);
            return h * 60 + m;
        };
        const pickupMinutes = toMinutes(pickupTime);
        const openMinutes = toMinutes(stall.openHours.openTime);
        const closeMinutes = toMinutes(stall.openHours.closingTime);

        const withinHours = openMinutes <= closeMinutes
            ? (pickupMinutes >= openMinutes && pickupMinutes <= closeMinutes)
            : (pickupMinutes >= openMinutes || pickupMinutes <= closeMinutes); // handles overnight hours

        if (!withinHours) {
            return {
                success: false,
                reason: "pickup_time_outside_hours",
                data: {
                    openTime: stall.openHours.openTime,
                    closingTime: stall.openHours.closingTime
                }
            };
        }
    }

    const student = await models_1.StudentModel.findById(studentId);
    if (!student) return { success: false, reason: "student_not_found" };

    let totalAmount = 0;
    const orderLines = [];
    const stockDeductions = [];

    for (const item of items) {
        const product = stall.products.find(p => p._id.toString() === item.productId);
        if (!product) return { success: false, reason: "product_not_found", productId: item.productId };
        if (!product.available) return { success: false, reason: "product_unavailable", productName: product.productName };
        if (product.stocks < item.quantity) return { success: false, reason: "insufficient_stock", productName: product.productName };

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

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

        stockDeductions.push({ product, quantity: item.quantity });
    }

    // ── Budget cap check (before committing anything) ──────────────────
    const now = new Date();
    const activeCap = student.budgetCap.find(b =>
        b.status === "active" &&
        new Date(b.startDate) <= now &&
        new Date(b.endDate) >= now
    );

    if (activeCap && totalAmount > activeCap.currentBudget && !confirmOverBudget) {
        return {
            success: false,
            reason: "over_budget",
            data: {
                currentBudget: activeCap.currentBudget,
                totalAmount
            }
        };
    }

    // ── Commit stock deductions ─────────────────────────────────────────
    for (const { product, quantity } of stockDeductions) {
        product.stocks -= quantity;
    }
    await stall.save();

    // ── Deduct from active budget cap (student array + Budget collection) ──
    if (activeCap) {
        activeCap.currentBudget -= totalAmount;
        await student.save();
        await models_1.BudgetModel.updateOne(
            { _id: activeCap._id },
            { $set: { currentBudget: activeCap.currentBudget } }
        );
    }

    const orderId = new mongoose_1.Types.ObjectId();

    const existingOrdersCount = await models_1.OrderModel.countDocuments({ studentId });
    const orderNumber = existingOrdersCount + 1;

    const order = await models_1.OrderModel.create({
        _id: orderId,
        studentId,
        stallId,
        course: student.course,
        orderLines,
        totalAmount,
        orderStatus: "pending",
        paymentMethod,
        pickupTime,
        orderNumber,
        paymentRecord: {
            orderId: orderId,
            totalAmount,
            paymentMethod,
            paymentReference: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            proofOfPaymentUrl: proofOfPaymentUrl || null,
            referenceNumber: referenceNumber || null,
            status: "pending"
        }
    });

    const populatedOrder = await models_1.OrderModel.findById(order._id)
        .populate("studentId", "firstName lastName email tuptId course section profilePictureUrl")
        .populate("stallId", "stallName stallPicture section");

    await checkBudgetCapAndNotify(studentId, totalAmount);

    return {
        success: true,
        data: {
            order: populatedOrder.toObject(),
            currentBudget: activeCap ? activeCap.currentBudget : null
        }
    };
}

// ── BUDGET CAP CHECK ─────────────────────────────────────────────────────
async function checkBudgetCapAndNotify(studentId, orderTotal) {
    const student = await models_1.StudentModel.findById(studentId).select("email budgetCap");
    if (!student || !student.budgetCap || student.budgetCap.length === 0) return;

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
        .sort({ createdAt: 1 })
        .lean();
}

// ── GET STALL ORDERS ──────────────────────────────────────────────────
async function getStallOrders(stallId) {
    return models_1.OrderModel.find({ stallId })
        .populate("studentId", "firstName lastName email tuptId course section")
        .sort({ createdAt: 1 })
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
async function updateOrderStatus(orderId, status, vendorAuthId) {
    const order = await models_1.OrderModel.findById(orderId);
    if (!order) return { success: false, reason: "order_not_found" };

    // Resolve the vendor's email from their auth ID, then verify they belong to this stall
    const vendor = await models_1.VendorModel.findById(vendorAuthId).select("email").lean();
    if (!vendor) return { success: false, reason: "unauthorized" };

    const stall = await models_1.StallModel.findOne({
        _id: order.stallId,
        "vendors.email": vendor.email
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
        if (paymentData.proofOfPaymentUrl) updateData["paymentRecord.proofOfPaymentUrl"] = paymentData.proofOfPaymentUrl;
        if (paymentData.referenceNumber) updateData["paymentRecord.referenceNumber"] = paymentData.referenceNumber;
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