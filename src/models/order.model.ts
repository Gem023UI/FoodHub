import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stallId: { type: Schema.Types.ObjectId, ref: "Stall", required: true, index: true },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 }
      }
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["Cash", "GCash"], required: true },
    gcashNumber: { type: String, default: null },
    pickupTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Ready", "Completed", "Cancelled"],
      default: "Pending",
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
      index: true
    }
  },
  { timestamps: true }
);

export type Order = InferSchemaType<typeof orderSchema> & {
  userId: Types.ObjectId;
  stallId: Types.ObjectId;
};
export const OrderModel = model("Order", orderSchema);
