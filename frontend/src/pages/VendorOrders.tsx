import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getVendorStall, getStallVendors } from "../services/stall.service";
import { getStallOrders, updateOrderStatus, updatePaymentStatus } from "../services/order.service";
import "../styles/VendorOrders.css";

interface Order {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    tuptId: string;
    course: string;
    section: string;
    profilePictureUrl: string | null;
  };
  orderLines: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  totalAmount: number;
  paymentMethod: "cash" | "gcash" | "paymaya";
  pickupTime: string;
  orderStatus: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  paymentRecord: {
    status: "pending" | "paid" | "refunded";
    paymentMethod: string;
    paymentReference: string;
  };
  createdAt: string;
}

interface VendorOrdersProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

type TabType = "pending" | "preparing" | "ready" | "completed" | "all";

export function VendorOrders({ token, onNavigate, onLogout }: VendorOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [stallId, setStallId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [token]);

  async function loadOrders() {
    setIsLoading(true);
    setError(null);
    try {
      // Get stall first
      const stall = await getVendorStall(token);
      setStallId(stall._id);
      
      // Get orders for the stall
      const data = await getStallOrders(token, stall._id);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(orderId: string, status: Order["orderStatus"]) {
    setUpdatingOrderId(orderId);
    setError(null);
    try {
      await updateOrderStatus(token, orderId, status);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handlePaymentRefund(orderId: string) {
    setUpdatingOrderId(orderId);
    setError(null);
    try {
      await updatePaymentStatus(token, orderId, "refunded");
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refund payment");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const filteredOrders = orders.filter(order => {
    if (activeTab === "all") return true;
    return order.orderStatus === activeTab;
  });

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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "payment-paid";
      case "pending": return "payment-unpaid";
      case "refunded": return "payment-refunded";
      default: return "";
    }
  };

  const getNextStatus = (current: Order["orderStatus"]): Order["orderStatus"] | null => {
    const flow: Record<Order["orderStatus"], Order["orderStatus"] | null> = {
      "pending": "preparing",
      "preparing": "ready",
      "ready": "completed",
      "completed": null,
      "cancelled": null
    };
    return flow[current] || null;
  };

  const getStatusLabel = (status: Order["orderStatus"]) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const tabCounts = {
    pending: orders.filter(o => o.orderStatus === "pending").length,
    preparing: orders.filter(o => o.orderStatus === "preparing").length,
    ready: orders.filter(o => o.orderStatus === "ready").length,
    completed: orders.filter(o => o.orderStatus === "completed").length,
    all: orders.length
  };

  if (isLoading) {
    return (
      <div className="vendor-orders-page">
        <div className="vendor-orders-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="vendor-orders-page">
      <div className="vendor-orders-container">
        <div className="vendor-orders-header">
          <h1>Orders</h1>
          <button className="refresh-btn" onClick={loadOrders}>
            <i className="fas fa-sync"></i> Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="order-tabs">
          <button
            className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending
            <span className="tab-count">{tabCounts.pending}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "preparing" ? "active" : ""}`}
            onClick={() => setActiveTab("preparing")}
          >
            Preparing
            <span className="tab-count">{tabCounts.preparing}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "ready" ? "active" : ""}`}
            onClick={() => setActiveTab("ready")}
          >
            Ready
            <span className="tab-count">{tabCounts.ready}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            Completed
            <span className="tab-count">{tabCounts.completed}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
            <span className="tab-count">{tabCounts.all}</span>
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-orders">
            <div className="empty-icon">📋</div>
            <h3>No orders to display</h3>
            <p>Orders will appear here once students place them.</p>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Student</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Pickup</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="order-row">
                    <td className="order-id">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="student-info">
                      <div className="student-name">
                        {order.studentId.firstName} {order.studentId.lastName}
                      </div>
                      <div className="student-course">
                        {order.studentId.course} - {order.studentId.section}
                      </div>
                    </td>
                    <td>
                      <div className="order-items-list">
                        {order.orderLines.map((item, index) => (
                          <div key={index} className="order-item-line">
                            <span>{item.productName}</span>
                            <span>×{item.quantity}</span>
                            <span>₱{item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="order-total">
                      ₱{order.totalAmount.toFixed(2)}
                    </td>
                    <td>
                      <div className="payment-info">
                        <span className="payment-method">
                          {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                        </span>
                        <span className={`payment-status ${getPaymentStatusColor(order.paymentRecord?.status || "pending")}`}>
                          {order.paymentRecord?.status || "Pending"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`order-status-badge ${getStatusColor(order.orderStatus)}`}>
                        {getStatusLabel(order.orderStatus)}
                      </span>
                    </td>
                    <td className="pickup-time">{order.pickupTime}</td>
                    <td>
                      <div className="action-buttons">
                        {order.orderStatus !== "completed" && order.orderStatus !== "cancelled" && (
                          <>
                            {getNextStatus(order.orderStatus) && (
                              <button
                                className="status-update-btn"
                                onClick={() => handleStatusUpdate(order._id, getNextStatus(order.orderStatus)!)}
                                disabled={updatingOrderId === order._id}
                              >
                                {updatingOrderId === order._id ? (
                                  <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                  `Mark ${getStatusLabel(getNextStatus(order.orderStatus)!)}`
                                )}
                              </button>
                            )}
                            {order.orderStatus === "pending" && (
                              <button
                                className="status-update-btn cancel"
                                onClick={() => handleStatusUpdate(order._id, "cancelled")}
                                disabled={updatingOrderId === order._id}
                              >
                                Cancel
                              </button>
                            )}
                          </>
                        )}
                        {order.paymentRecord?.status === "paid" && order.orderStatus === "completed" && (
                          <button
                            className="status-update-btn cancel"
                            onClick={() => handlePaymentRefund(order._id)}
                            disabled={updatingOrderId === order._id}
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}