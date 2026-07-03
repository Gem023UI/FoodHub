"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const order_controller_1 = require("../controllers/order.controller");
const stall_controller_1 = require("../controllers/stall.controller");
const models_1 = require("../models"); // ADD THIS IMPORT

const orderRouter = (0, express_1.Router)();
exports.orderRouter = orderRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ── CREATE ORDER ──────────────────────────────────────────────────────────
orderRouter.post("/", auth_1.authenticateRequest, async (request, response) => {
    const { stallId, items, paymentMethod } = request.body;
    const studentId = request.userId;

    console.log("📦 Order request:", { 
        stallId, 
        itemsCount: items?.length, 
        paymentMethod,
        studentId 
    });

    if (!stallId || !items || !items.length || !paymentMethod) {
        console.log("❌ Missing fields:", { 
            hasStallId: !!stallId, 
            hasItems: !!items, 
            itemsLength: items?.length, 
            hasPaymentMethod: !!paymentMethod
        });
        response.status(400).json({ 
            message: "stallId, items, and paymentMethod are required." 
        });
        return;
    }

    const result = await (0, order_controller_1.createOrder)({
        studentId,
        stallId,
        items,
        paymentMethod
    });

    console.log("📦 Order result success:", result.success);

    if (!result.success) {
        const messages = {
            stall_not_found: "Stall not found.",
            student_not_found: "Student not found.",
            product_not_found: "Product not found.",
            product_unavailable: "Product is unavailable.",
            insufficient_stock: "Insufficient stock for product.",
            missing_required_fields: "Missing required fields."
        };
        response.status(400).json({ 
            message: messages[result.reason] || "Failed to create order." 
        });
        return;
    }

    response.status(201).json({ order: result.data.order });
});

// ── GET STUDENT ORDERS ──────────────────────────────────────────────────
orderRouter.get("/student", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    
    try {
        const orders = await (0, order_controller_1.getStudentOrders)(studentId);
        response.json({ orders });
    } catch (error) {
        console.error("Error fetching student orders:", error);
        response.status(500).json({ message: "Failed to fetch orders." });
    }
});

// ── GET STUDENT ORDERS WITH DATE RANGE ──────────────────────────────────
orderRouter.get("/student/range", auth_1.authenticateRequest, async (request, response) => {
    const studentId = request.userId;
    const { startDate, endDate } = request.query;
    
    try {
        console.log("📅 Order range request:", { studentId, startDate, endDate });
        
        let query = { studentId };
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }
        
        console.log("📅 Query:", JSON.stringify(query));
        
        const orders = await models_1.OrderModel.find(query)
            .populate("stallId", "stallName stallPicture section")
            .sort({ createdAt: -1 })
            .lean();
        
        console.log(`📅 Found ${orders.length} orders`);
        response.json({ orders });
    } catch (error) {
        console.error("Error fetching student orders with date range:", error);
        response.status(500).json({ 
            message: "Failed to fetch orders.",
            error: error.message 
        });
    }
});

// ── GET STALL ORDERS ──────────────────────────────────────────────────
orderRouter.get("/stall/:stallId", auth_1.authenticateRequest, async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    
    try {
        const isAdmin = request.role === "admin";
        const isVendor = request.role === "vendor";
        
        if (isVendor) {
            const stall = await (0, stall_controller_1.getStallByVendorAuthId)(request.userId);
            if (!stall || stall._id.toString() !== stallId) {
                return response.status(403).json({ message: "Unauthorized to view these orders." });
            }
        }

        const orders = await (0, order_controller_1.getStallOrders)(stallId);
        response.json({ orders });
    } catch (error) {
        console.error("Error fetching stall orders:", error);
        response.status(500).json({ message: "Failed to fetch orders." });
    }
});

// ── GET ORDER BY ID ──────────────────────────────────────────────────────
orderRouter.get("/:orderId", auth_1.authenticateRequest, async (request, response) => {
    const orderId = firstParam(request.params.orderId);
    
    try {
        const order = await (0, order_controller_1.getOrderById)(orderId);
        if (!order) {
            response.status(404).json({ message: "Order not found." });
            return;
        }

        const isStudent = order.studentId._id.toString() === request.userId;
        const isAdmin = request.role === "admin";
        
        let isVendor = false;
        if (request.role === "vendor") {
            const stall = await (0, stall_controller_1.getStallByVendorAuthId)(request.userId);
            if (stall && stall._id.toString() === order.stallId._id.toString()) {
                isVendor = true;
            }
        }

        if (!isStudent && !isVendor && !isAdmin) {
            response.status(403).json({ message: "Unauthorized to view this order." });
            return;
        }

        response.json({ order });
    } catch (error) {
        console.error("Error fetching order:", error);
        response.status(500).json({ message: "Failed to fetch order." });
    }
});

// ── UPDATE ORDER STATUS (Vendor only) ──────────────────────────────────
orderRouter.patch("/:orderId/status", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const orderId = firstParam(request.params.orderId);
    const { status } = request.body;
    const userEmail = request.userEmail;

    if (!status) {
        response.status(400).json({ message: "Status is required." });
        return;
    }

    const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(status.toLowerCase())) {
        response.status(400).json({ 
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
        });
        return;
    }

    const result = await (0, order_controller_1.updateOrderStatus)(orderId, status.toLowerCase(), userEmail);
    
    if (!result.success) {
        const messages = {
            order_not_found: "Order not found.",
            unauthorized: "You are not authorized to update this order.",
            order_finalized: "Cannot update a completed or cancelled order."
        };
        response.status(400).json({ 
            message: messages[result.reason] || "Failed to update order status." 
        });
        return;
    }

    response.json({ order: result.data.order });
});

// ── UPDATE PAYMENT STATUS ──────────────────────────────────────────────────
orderRouter.patch("/:orderId/payment", auth_1.authenticateRequest, async (request, response) => {
    const orderId = firstParam(request.params.orderId);
    const { paymentStatus, paymentData } = request.body;

    if (!paymentStatus) {
        response.status(400).json({ message: "Payment status is required." });
        return;
    }

    const validStatuses = ["pending", "paid", "refunded"];
    if (!validStatuses.includes(paymentStatus.toLowerCase())) {
        response.status(400).json({ 
            message: `Invalid payment status. Must be one of: ${validStatuses.join(", ")}` 
        });
        return;
    }

    try {
        const order = await (0, order_controller_1.getOrderById)(orderId);
        if (!order) {
            return response.status(404).json({ message: "Order not found." });
        }

        const isStudent = order.studentId._id.toString() === request.userId;
        const isAdmin = request.role === "admin";
        
        let isVendor = false;
        if (request.role === "vendor") {
            const stall = await (0, stall_controller_1.getStallByVendorAuthId)(request.userId);
            if (stall && stall._id.toString() === order.stallId._id.toString()) {
                isVendor = true;
            }
        }

        if (!isStudent && !isVendor && !isAdmin) {
            return response.status(403).json({ message: "Unauthorized to update payment." });
        }

        if (paymentStatus === "paid" && !isStudent && !isAdmin) {
            return response.status(403).json({ message: "Only students can mark payment as paid." });
        }

        if (paymentStatus === "refunded" && !isVendor && !isAdmin) {
            return response.status(403).json({ message: "Only vendors or admins can refund payments." });
        }

        const result = await (0, order_controller_1.updatePaymentStatus)(orderId, paymentStatus.toLowerCase(), paymentData);
        
        if (!result.success) {
            response.status(400).json({ 
                message: "Failed to update payment status." 
            });
            return;
        }

        response.json({ order: result.data.order });
    } catch (error) {
        console.error("Error updating payment:", error);
        response.status(500).json({ message: "Failed to update payment status." });
    }
});