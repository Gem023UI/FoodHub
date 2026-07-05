import { useState } from "react";
import { Order } from "../services/order.service";
import "../styles/VendorOrderCard.css";

interface VendorOrderCardProps {
  order: Order;
  onUpdateOrderStatus: (orderId: string, status: Order["orderStatus"]) => void;
  onUpdatePaymentStatus: (orderId: string, status: "pending" | "paid" | "refunded") => void;
  updatingOrderId: string | null;
}

export function VendorOrderCard({ order, onUpdateOrderStatus, onUpdatePaymentStatus, updatingOrderId }: VendorOrderCardProps) {
  const [showProofModal, setShowProofModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<Order["orderStatus"] | null>(null);

  const student = typeof order.studentId === "string" ? null : order.studentId;
  const isUpdating = updatingOrderId === order._id;
  const isFinalized = order.orderStatus === "completed" || order.orderStatus === "cancelled";
  const hasProof = order.paymentMethod === "gcash" || order.paymentMethod === "paymaya";
  const paymentIsPending = (order.paymentRecord?.status || "pending") === "pending";

  const getStatusColor = (status: Order["orderStatus"]) => {
    switch (status) {
      case "pending": return "status-pending";
      case "preparing": return "status-preparing";
      case "ready": return "status-ready";
      case "completed": return "status-completed";
      case "cancelled": return "status-cancelled";
      default: return "";
    }
  };

  function handleOrderStatusSelect(newStatus: Order["orderStatus"]) {
    if (newStatus === order.orderStatus) return;

    if (paymentIsPending) {
      // Ask for confirmation before changing order status while payment is unpaid
      setPendingStatusChange(newStatus);
      return;
    }

    onUpdateOrderStatus(order._id, newStatus);
  }

  function confirmPendingStatusChange() {
    if (pendingStatusChange) {
      onUpdateOrderStatus(order._id, pendingStatusChange);
    }
    setPendingStatusChange(null);
  }

  return (
    <div className="vendor-order-card">
      <div className="voc-header-row">
        <span className="voc-order-no">#{order._id.slice(-6).toUpperCase()}</span>
        <span className="voc-pickup-time">
          <i className="fas fa-clock"></i> Pickup: {order.pickupTime}
        </span>
      </div>

      {student && (
        <div className="voc-student-row">
          <span className="voc-student-name">{student.firstName} {student.lastName}</span>
          <span className="voc-student-course">{student.course} - {student.section}</span>
        </div>
      )}

      <div className="voc-order-lines">
        {order.orderLines.map((line, index) => (
          <div key={index} className="voc-order-line">
            <span className="voc-line-name">{line.productName}</span>
            <span className="voc-line-qty">×{line.quantity}</span>
            <span className="voc-line-subtotal">₱{line.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="voc-actions-row">
        <div className="voc-actions-left">
          <span className={`order-status-badge ${getStatusColor(order.orderStatus)}`}>
            {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
          </span>

          <select
            className="voc-select"
            value={order.orderStatus}
            onChange={(e) => handleOrderStatusSelect(e.target.value as Order["orderStatus"])}
            disabled={isUpdating || isFinalized}
          >
            <option value="pending">Order: Pending</option>
            <option value="preparing">Order: Preparing</option>
            <option value="ready">Order: Ready</option>
            <option value="completed">Order: Completed</option>
            <option value="cancelled">Order: Cancelled</option>
          </select>

          <select
            className="voc-select"
            value={order.paymentRecord?.status || "pending"}
            onChange={(e) => onUpdatePaymentStatus(order._id, e.target.value as "pending" | "paid" | "refunded")}
            disabled={isUpdating}
          >
            <option value="pending">Payment: Pending</option>
            <option value="paid">Payment: Paid</option>
            <option value="refunded">Payment: Refunded</option>
          </select>

          {hasProof && (
            <button className="voc-proof-btn" onClick={() => setShowProofModal(true)}>
              <i className="fas fa-receipt"></i> View Proof of Payment
            </button>
          )}
        </div>

        <div className="voc-total">
          Total: <span>₱{order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Proof of payment modal ── */}
      {showProofModal && (
        <div className="voc-modal-overlay" onClick={() => setShowProofModal(false)}>
          <div className="voc-modal" onClick={(e) => e.stopPropagation()}>
            <button className="voc-modal-close" onClick={() => setShowProofModal(false)}>×</button>
            <h3>Proof of Payment</h3>
            <p className="voc-modal-ref">
              Reference No.: <strong>{order.paymentRecord?.referenceNumber || "N/A"}</strong>
            </p>
            {order.paymentRecord?.proofOfPaymentUrl ? (
              <img
                src={order.paymentRecord.proofOfPaymentUrl}
                alt="Proof of payment"
                className="voc-modal-image"
              />
            ) : (
              <p>No proof of payment uploaded.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Payment-still-pending confirmation modal ── */}
      {pendingStatusChange && (
        <div className="voc-modal-overlay" onClick={() => setPendingStatusChange(null)}>
          <div className="voc-modal voc-warning-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Payment Still Pending</h3>
            <p>
              This order's payment status is still <strong>Pending</strong>. Are you sure you want to
              update the order status to <strong>{pendingStatusChange}</strong> before payment is confirmed?
            </p>
            <div className="voc-modal-actions">
              <button className="btn-secondary" onClick={() => setPendingStatusChange(null)} disabled={isUpdating}>
                Cancel
              </button>
              <button className="btn-primary" onClick={confirmPendingStatusChange} disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Proceed Anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}