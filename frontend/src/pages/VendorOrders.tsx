import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getVendorStall } from "../services/stall.service";
import { getStallOrders, updateOrderStatus, updatePaymentStatus, Order } from "../services/order.service";
import { VendorOrderCard } from "../components/VendorOrderCard";
import "../styles/VendorOrders.css";

interface VendorOrdersProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

type StatusFilter = "all" | "pending" | "preparing" | "ready" | "completed" | "cancelled";

export function VendorOrders({ token, onNavigate, onLogout }: VendorOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [token]);

  async function loadOrders() {
    setIsLoading(true);
    setError(null);
    try {
      const stall = await getVendorStall(token);
      const data = await getStallOrders(token, stall._id);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOrderStatusUpdate(orderId: string, status: Order["orderStatus"]) {
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

  async function handlePaymentStatusUpdate(orderId: string, status: "pending" | "paid" | "refunded") {
    setUpdatingOrderId(orderId);
    setError(null);
    try {
      await updatePaymentStatus(token, orderId, status);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment status");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter === "all") return true;
    return order.orderStatus === statusFilter;
  });

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
          <div className="vendor-orders-title-row">
            <h1>Orders</h1>
            <select
              className="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button className="refresh-btn" onClick={loadOrders}>
            <i className="fas fa-sync"></i> Refresh
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {filteredOrders.length === 0 ? (
          <div className="empty-orders">
            <div className="empty-icon">📋</div>
            <h3>No orders to display</h3>
            <p>Orders will appear here once students place them.</p>
          </div>
        ) : (
          <div className="vendor-order-cards">
            {filteredOrders.map((order) => (
              <VendorOrderCard
                key={order._id}
                order={order}
                onUpdateOrderStatus={handleOrderStatusUpdate}
                onUpdatePaymentStatus={handlePaymentStatusUpdate}
                updatingOrderId={updatingOrderId}
              />
            ))}
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}