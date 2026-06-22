import { Router, type Request, type Response } from "express";
import { authenticateRequest, authorizeRoles } from "../middleware/auth";
import {
  createOrder,
  getStudentOrders,
  getVendorOrders,
  updateOrderStatus,
  canManageOrder
} from "../services/order.service";
import { OrderModel } from "../models";

const ordersRouter = Router();

ordersRouter.use(authenticateRequest);

// Place order (Student/Buyer)
ordersRouter.post("/", async (request: Request, response: Response) => {
  const { stallId, items, paymentMethod, pickupTime, gcashNumber } = request.body as {
    stallId?: string;
    items?: Array<{ menuItemId: string; quantity: number }>;
    paymentMethod?: "Cash" | "GCash";
    gcashNumber?: string;
    pickupTime?: string;
  };

  if (!stallId || !items || !items.length || !paymentMethod || !pickupTime) {
    response.status(400).json({ message: "stallId, items, paymentMethod, and pickupTime are required." });
    return;
  }

  try {
    const order = await createOrder({
      userId: request.userId as string,
      stallId,
      items,
      paymentMethod,
      gcashNumber,
      pickupTime
    });
    response.status(201).json({ order });
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : "Failed to place order." });
  }
});

// List student's own orders
ordersRouter.get("/student", async (request: Request, response: Response) => {
  try {
    const orders = await getStudentOrders(request.userId as string);
    response.json({ orders });
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch student orders." });
  }
});

// List vendor's stall orders
ordersRouter.get("/vendor", authorizeRoles("vendor", "admin"), async (request: Request, response: Response) => {
  try {
    const orders = await getVendorOrders(request.userId as string);
    response.json({ orders });
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch vendor orders." });
  }
});

// Update order status (Student cancel / Vendor/Admin update)
ordersRouter.patch("/:orderId", async (request: Request, response: Response) => {
  const orderId = request.params.orderId as string;
  const { status, paymentStatus } = request.body as {
    status?: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
    paymentStatus?: "Unpaid" | "Paid";
  };

  try {
    const orderDoc = await OrderModel.findById(orderId);
    if (!orderDoc) {
      response.status(404).json({ message: "Order not found." });
      return;
    }

    const isOwner = orderDoc.userId.toString() === (request.userId as string);
    const isVendorOrAdmin = request.role === "admin" || await canManageOrder(orderId, request.userId as string, request.role as string);

    if (!isOwner && !isVendorOrAdmin) {
      response.status(403).json({ message: "You cannot manage this order." });
      return;
    }

    // Student specific restrictions
    if (isOwner && !isVendorOrAdmin) {
      if (status !== "Cancelled") {
        response.status(400).json({ message: "Students can only change status to Cancelled." });
        return;
      }
      if (paymentStatus) {
        response.status(400).json({ message: "Students cannot update payment status." });
        return;
      }
      if (orderDoc.status === "Ready" || orderDoc.status === "Completed" || orderDoc.status === "Cancelled") {
        response.status(400).json({ message: `Cannot cancel order. It is already ${orderDoc.status.toLowerCase()}.` });
        return;
      }
    }

    const updated = await updateOrderStatus(orderId, { status, paymentStatus });
    response.json({ order: updated });
  } catch (error) {
    response.status(500).json({ message: "Failed to update order status." });
  }
});

export { ordersRouter };
export default ordersRouter;
