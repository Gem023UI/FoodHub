import { useEffect, useState } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStudentOrders, type Order } from "../services/order.service";
import "../styles/Orders.css";

interface StudentOrdersProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

const STATUS_ORDER: Order["orderStatus"][] = ["ready", "preparing", "pending", "completed", "cancelled"];

const STATUS_LABELS: Record<Order["orderStatus"], string> = {
  ready: "Ready",
  preparing: "Preparing",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PAYMENT_LABELS: Record<Order["paymentMethod"], string> = {
  cash: "Cash",
  gcash: "GCash",
  paymaya: "Maya",
};

export function StudentOrders({ token, onNavigate, onLogout }: StudentOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, [token]);

  async function loadOrders() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStudentOrders(token);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }

  function getStallName(order: Order): string {
    return typeof order.stallId === "string" ? "—" : order.stallId.stallName;
  }

  function getStallSection(order: Order): number | string {
    return typeof order.stallId === "string" ? "—" : order.stallId.section;
  }

  const groupedOrders = STATUS_ORDER.map((status) => ({
    status,
    orders: orders
      .filter((o) => o.orderStatus === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  }));

  if (isLoading) {
    return (
      <div className="so-page">
        <div className="so-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="so-page">
      <div className="so-container">
        <div className="so-header">
          <h1>My Orders</h1>
          <button className="so-refresh-btn" onClick={loadOrders}>
            <i className="fas fa-sync"></i> Refresh
          </button>
        </div>

        {error && <div className="alert alert-error so-alert">{error}</div>}

        {orders.length === 0 ? (
          <div className="so-empty">
            <div className="so-empty-icon">📋</div>
            <h3>No orders yet</h3>
            <p>Your order history will appear here once you place an order.</p>
          </div>
        ) : (
          groupedOrders.map(({ status, orders: statusOrders }) => (
            statusOrders.length > 0 && (
              <section key={status} className="so-status-section">
                <h2 className={`so-status-heading so-status-${status}`}>
                  {STATUS_LABELS[status]}
                  <span className="so-status-count">{statusOrders.length}</span>
                </h2>

                <div className="so-order-list">
                  {statusOrders.map((order) => (
                    <div key={order._id} className="so-order-card">
                      <div className="so-order-main">
                        <div className="so-order-col so-order-stall">
                          <span className="so-label">Stall</span>
                          <span className="so-value">{getStallName(order)}</span>
                        </div>
                        <div className="so-order-col">
                          <span className="so-label">Section</span>
                          <span className="so-value">{getStallSection(order)}</span>
                        </div>
                        <div className="so-order-col">
                          <span className="so-label">Total Price</span>
                          <span className="so-value so-total">₱{order.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="so-order-col">
                          <span className="so-label">Payment</span>
                          <span className="so-value">{PAYMENT_LABELS[order.paymentMethod]}</span>
                        </div>
                      </div>

                      <div className="so-order-footer">
                        <div className="so-pickup-info">
                          <i className="fas fa-clock"></i>
                          <span>
                            Pickup: {order.pickupTime} &nbsp;•&nbsp;{" "}
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <button
                          className="so-details-btn"
                          onClick={() => setDetailsTarget(order)}
                        >
                          View Order Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          ))
        )}
      </div>

      <Footer onNavigate={onNavigate} />

      {/* ── Order details modal ── */}
      {detailsTarget && (
        <div className="so-modal-overlay" onClick={() => setDetailsTarget(null)}>
          <div className="so-modal" onClick={(e) => e.stopPropagation()}>
            <button className="so-modal-close" onClick={() => setDetailsTarget(null)}>×</button>
            <h3>Order Details</h3>
            <p className="so-modal-sub">
              {getStallName(detailsTarget)} — Section {getStallSection(detailsTarget)}
            </p>

            <div className="so-modal-lines">
              {detailsTarget.orderLines.map((line, i) => (
                <div key={i} className="so-modal-line">
                  <span className="so-modal-line-name">{line.productName}</span>
                  <span className="so-modal-line-qty">× {line.quantity}</span>
                  <span className="so-modal-line-subtotal">₱{line.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="so-modal-total">
              <span>Total</span>
              <span>₱{detailsTarget.totalAmount.toFixed(2)}</span>
            </div>

            <div className="so-modal-meta">
              <p><strong>Payment Method:</strong> {PAYMENT_LABELS[detailsTarget.paymentMethod]}</p>
              <p><strong>Payment Status:</strong> {detailsTarget.paymentRecord?.status || "pending"}</p>
              <p><strong>Pickup Time:</strong> {detailsTarget.pickupTime}</p>
              <p><strong>Order Date:</strong> {new Date(detailsTarget.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>

            <div className="so-modal-actions">
              <button className="so-modal-btn" onClick={() => setDetailsTarget(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}