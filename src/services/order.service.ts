import { OrderModel, MenuItemModel, StallModel } from "../models";
import { isValidObjectId } from "mongoose";

export interface CreateOrderInput {
  userId: string;
  stallId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  paymentMethod: "Cash" | "GCash";
  gcashNumber?: string | undefined;
  pickupTime: string;
}

export async function createOrder(input: CreateOrderInput) {
  if (!isValidObjectId(input.stallId)) {
    throw new Error("Invalid stall ID.");
  }

  const stall = await StallModel.findById(input.stallId);
  if (!stall) {
    throw new Error("Stall not found.");
  }

  const menuItemIds = input.items.map(item => item.menuItemId);
  if (menuItemIds.some(id => !isValidObjectId(id))) {
    throw new Error("One or more invalid menu item IDs.");
  }

  const dbMenuItems = await MenuItemModel.find({ _id: { $in: menuItemIds } });

  let totalAmount = 0;
  const orderItems = input.items.map(inputItem => {
    const dbItem = dbMenuItems.find(i => i._id.toString() === inputItem.menuItemId);
    if (!dbItem) {
      throw new Error(`Menu item not found: ${inputItem.menuItemId}`);
    }
    if (!dbItem.isAvailable) {
      throw new Error(`Menu item is currently unavailable: ${dbItem.name}`);
    }
    if (dbItem.stallId.toString() !== input.stallId) {
      throw new Error(`Menu item "${dbItem.name}" does not belong to stall "${stall.name}".`);
    }

    const price = dbItem.price;
    totalAmount += price * inputItem.quantity;

    return {
      menuItemId: dbItem._id,
      name: dbItem.name,
      price,
      quantity: inputItem.quantity
    };
  });

  const order = await OrderModel.create({
    userId: input.userId,
    stallId: input.stallId,
    items: orderItems,
    totalAmount,
    paymentMethod: input.paymentMethod,
    gcashNumber: input.gcashNumber || null,
    pickupTime: input.pickupTime,
    status: "Pending",
    paymentStatus: "Unpaid"
  });

  return order;
}

export async function getStudentOrders(userId: string) {
  if (!isValidObjectId(userId)) {
    return [];
  }
  return OrderModel.find({ userId })
    .populate("stallId", "name location category photoUrl")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getVendorOrders(vendorId: string) {
  if (!isValidObjectId(vendorId)) {
    return [];
  }
  const stalls = await StallModel.find({ vendorId });
  const stallIds = stalls.map(s => s._id);

  return OrderModel.find({ stallId: { $in: stallIds } })
    .populate("userId", "name email contactNumber studentId courseSection schoolEmail")
    .populate("stallId", "name")
    .sort({ createdAt: -1 })
    .lean();
}

export async function updateOrderStatus(
  orderId: string,
  input: {
    status?: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled" | undefined;
    paymentStatus?: "Unpaid" | "Paid" | undefined;
  }
) {
  if (!isValidObjectId(orderId)) {
    return null;
  }
  return OrderModel.findByIdAndUpdate(orderId, { $set: input }, { new: true });
}

export async function canManageOrder(orderId: string, userId: string, role: string): Promise<boolean> {
  if (role === "admin") {
    return true;
  }
  if (role !== "vendor") {
    return false;
  }
  if (!isValidObjectId(orderId) || !isValidObjectId(userId)) {
    return false;
  }

  const order = await OrderModel.findById(orderId);
  if (!order) {
    return false;
  }

  const stall = await StallModel.findById(order.stallId);
  return !!(stall && stall.vendorId.toString() === userId);
}
