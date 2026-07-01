import { useState, useEffect } from "react";
import { VendorHeader } from "../components/VendorHeader";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getVendorOrders, updateOrderStatus } from "../lib/api";
import "../styles/VendorOrders.css";

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

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
  };
  orderLines: OrderItem[];
  totalAmount: number;
  paymentMethod: "Cash" | "GCash" | "Maya";
  gcashNumber: string | null;
  pickupTime: string;
  orderStatus: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  paymentStatus: "Unpaid" | "Paid" | "Failed" | "Refunded";
  createdAt: string;
}

interface VendorOrdersProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

type TabType = "pending" | "paid" | "all";

export function VendorOrders({ token, onNavigate, onLogout }: VendorOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVendorOrders(token);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(orderId: string, status: Order["orderStatus"]) {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(token, orderId, status);
      // Refresh orders
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const filteredOrders = orders.filter(order => {
    if (activeTab === "pending") {
      return order.paymentStatus === "Paid" && 
        ["Pending", "Preparing", "Ready"].includes(order.orderStatus);
    }
    if (activeTab === "paid") {
      return order.paymentStatus === "Paid" && 
        ["Completed"].includes(order.orderStatus);
    }
    return true;
  });

  const getStatusColor = (status: Order["orderStatus"]) => {
    switch (status) {
      case "Pending": return "status-pending";
      case "Preparing": return "status-preparing";
      case "Ready": return "status-ready";
      case "Completed": return "status-completed";
      case "Cancelled": return "status-cancelled";
      default: return "";
    }
  };

  const getPaymentStatusColor = (status: Order["paymentStatus"]) => {
    switch (status) {
      case "Paid": return "payment-paid";
      case "Unpaid": return "payment-unpaid";
      case "Failed": return "payment-failed";
      case "Refunded": return "payment-refunded";
      default: return "";
    }
  };

  const getNextStatus = (current: Order["orderStatus"]): Order["orderStatus"] | null => {
    const flow: Record<Order["orderStatus"], Order["orderStatus"] | null> = {
      "Pending": "Preparing",
      "Preparing": "Ready",
      "Ready": "Completed",
      "Completed": null,
      "Cancelled": null
    };
    return flow[current] || null;
  };

  if (isLoading) {
    return (
      <div className="vendor-orders-page">
        <VendorHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />
        <div className="vendor-orders-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="vendor-orders-page">
      <VendorHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />

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
            Pending Orders
            <span className="tab-count">
              {orders.filter(o => 
                o.paymentStatus === "Paid" && 
                ["Pending", "Preparing", "Ready"].includes(o.orderStatus)
              ).length}
            </span>
          </button>
          <button
            className={`tab-btn ${activeTab === "paid" ? "active" : ""}`}
            onClick={() => setActiveTab("paid")}
          >
            Completed Orders
            <span className="tab-count">
              {orders.filter(o => o.orderStatus === "Completed").length}
            </span>
          </button>
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Orders
            <span className="tab-count">{orders.length}</span>
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
                  <th>Action</th>
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
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="order-total">
                      ₱{order.totalAmount.toFixed(2)}
                    </td>
                    <td>
                      <div className="payment-info">
                        <span className="payment-method">{order.paymentMethod}</span>
                        <span className={`payment-status ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                        {order.gcashNumber && (
                          <span className="gcash-number">{order.gcashNumber}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`order-status-badge ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="pickup-time">{order.pickupTime}</td>
                    <td>
                      <div className="action-buttons">
                        {order.paymentStatus === "Paid" && order.orderStatus !== "Completed" && order.orderStatus !== "Cancelled" && (
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
                                  `Mark ${getNextStatus(order.orderStatus)}`
                                )}
                              </button>
                            )}
                          </>
                        )}
                        {order.orderStatus !== "Cancelled" && order.orderStatus !== "Completed" && (
                          <button
                            className="status-update-btn cancel"
                            onClick={() => handleStatusUpdate(order._id, "Cancelled")}
                            disabled={updatingOrderId === order._id}
                          >
                            Cancel
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