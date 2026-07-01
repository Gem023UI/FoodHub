"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;

const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const order_service_1 = require("../services/order.service");

const orderRouter = (0, express_1.Router)();
exports.orderRouter = orderRouter;

function firstParam(value) {
    return Array.isArray(value) ? value[0] : value;
}

// ── CREATE ORDER ──────────────────────────────────────────────────────────
orderRouter.post("/", auth_1.authenticateRequest, async (request, response) => {
    const { stallId, items, paymentMethod, gcashNumber, pickupTime } = request.body;
    const studentId = request.userId;

    if (!stallId || !items || !items.length || !paymentMethod || !pickupTime) {
        response.status(400).json({ 
            message: "stallId, items, paymentMethod, and pickupTime are required." 
        });
        return;
    }

    // Validate GCash number if payment method is GCash
    if (paymentMethod === "GCash" && !gcashNumber) {
        response.status(400).json({ 
            message: "GCash number is required for GCash payments." 
        });
        return;
    }

    const result = await (0, order_service_1.createOrder)({
        studentId,
        stallId,
        items,
        paymentMethod,
        gcashNumber,
        pickupTime
    });

    if (!result.success) {
        const messages = {
            stall_not_found: "Stall not found.",
            product_not_found: "Product not found.",
            product_unavailable: "Product is unavailable."
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
        const orders = await (0, order_service_1.getStudentOrders)(studentId);
        response.json({ orders });
    } catch (error) {
        console.error("Error fetching student orders:", error);
        response.status(500).json({ message: "Failed to fetch orders." });
    }
});

// ── GET VENDOR ORDERS ──────────────────────────────────────────────────
orderRouter.get("/vendor", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const vendorId = request.userId;
    
    try {
        const orders = await (0, order_service_1.getVendorOrders)(vendorId);
        response.json({ orders });
    } catch (error) {
        console.error("Error fetching vendor orders:", error);
        response.status(500).json({ message: "Failed to fetch orders." });
    }
});

// ── GET ORDER BY ID ──────────────────────────────────────────────────────
orderRouter.get("/:orderId", auth_1.authenticateRequest, async (request, response) => {
    const orderId = firstParam(request.params.orderId);
    
    try {
        const order = await (0, order_service_1.getOrderById)(orderId);
        if (!order) {
            response.status(404).json({ message: "Order not found." });
            return;
        }

        // Check authorization
        const isStudent = order.studentId._id.toString() === request.userId;
        const isVendor = await (0, order_service_1.isVendorForStall)(request.userId, order.stallId._id.toString());
        const isAdmin = request.role === "admin";

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
    const vendorId = request.userId;

    if (!status) {
        response.status(400).json({ message: "Status is required." });
        return;
    }

    const validStatuses = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
        response.status(400).json({ 
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
        });
        return;
    }

    const result = await (0, order_service_1.updateOrderStatus)(orderId, status, vendorId);
    
    if (!result.success) {
        const messages = {
            order_not_found: "Order not found.",
            unauthorized: "You are not authorized to update this order.",
            order_finalized: "Cannot update a completed or cancelled order.",
            payment_required: "Payment must be completed before updating order status."
        };
        response.status(400).json({ 
            message: messages[result.reason] || "Failed to update order status." 
        });
        return;
    }

    response.json({ order: result.data.order });
});

// ── UPDATE PAYMENT STATUS (Webhook) ────────────────────────────────────
orderRouter.post("/webhook/paymongo", async (request, response) => {
    // This endpoint will be called by PayMongo webhook
    // Implementation depends on PayMongo webhook structure
    try {
        const webhookData = request.body;
        // Process webhook data
        // Verify signature, extract payment info, update order
        response.json({ received: true });
    } catch (error) {
        console.error("Webhook error:", error);
        response.status(500).json({ message: "Webhook processing failed." });
    }
});