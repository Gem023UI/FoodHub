import { useState, useEffect } from "react";
import { fetchStudentOrders, updateOrderStatusAPI, type OrderSummary } from "../lib/api";

interface OrdersListProps {
  token: string;
  userId: string;
  role: string;
  onBack: () => void;
}

export function OrdersList({ token, onBack }: OrdersListProps) {
  const [studentOrders, setStudentOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<OrderSummary | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setOrdersLoading(true);
      const ordersData = await fetchStudentOrders(token);
      setStudentOrders(ordersData);
      setOrdersError(null);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : "Failed to load pre-orders");
    } finally {
      setOrdersLoading(false);
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this pre-order?")) {
      return;
    }
    try {
      setError(null);
      const res = await updateOrderStatusAPI(token, orderId, { status: "Cancelled" });
      setStudentOrders(prev => prev.map(o => o._id === orderId ? res.order : o));
      setSuccessMsg("Order cancelled successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel order.");
    }
  };

  const renderStepTracker = (status: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled") => {
    if (status === "Cancelled") {
      return (
        <div style={{ color: "#c62828", fontSize: "13px", fontWeight: "bold", background: "#ffebee", padding: "8px 12px", borderRadius: "6px" }}>
          ❌ This order was cancelled.
        </div>
      );
    }

    const steps = [
      { key: "Pending", label: "Received" },
      { key: "Preparing", label: "Preparing" },
      { key: "Ready", label: "Ready for Pickup" },
      { key: "Completed", label: "Picked Up" }
    ];

    const currentIdx = steps.findIndex(s => s.key === status);

    return (
      <div style={{ margin: "16px 0", padding: "10px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginBottom: "8px" }}>
          <div style={{
            position: "absolute",
            top: "10px",
            left: "5%",
            right: "5%",
            height: "4px",
            background: "#eee",
            zIndex: 1
          }} />
          <div style={{
            position: "absolute",
            top: "10px",
            left: "5%",
            width: `${currentIdx === -1 ? 0 : (currentIdx / (steps.length - 1)) * 90}%`,
            height: "4px",
            background: "#008080",
            zIndex: 2,
            transition: "width 0.4s ease"
          }} />

          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIdx;
            const isActive = idx === currentIdx;
            return (
              <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 3, flex: 1 }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: isCompleted ? "#008080" : "#fff",
                  border: isCompleted ? "none" : "2px solid #ddd",
                  color: isCompleted ? "#fff" : "#888",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  boxShadow: isActive ? "0 0 0 4px rgba(0, 128, 128, 0.2)" : "none"
                }}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span style={{
                  fontSize: "11.5px",
                  marginTop: "6px",
                  color: isActive ? "#008080" : isCompleted ? "#333" : "#888",
                  fontWeight: isActive || isCompleted ? "bold" : "normal",
                  textAlign: "center"
                }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <h1>My Pre-Orders</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="student-orders-section" style={{ marginTop: "20px" }}>
        {ordersLoading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>Loading pre-orders...</div>
        ) : ordersError ? (
          <div className="alert alert-error">{ordersError}</div>
        ) : studentOrders.length === 0 ? (
          <div className="profile-card" style={{ padding: "30px", textAlign: "center", color: "#666" }}>
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "10px" }}>🍽️</span>
            You haven't placed any pre-orders yet. Visit a food stall to place your first pre-order!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* ACTIVE ORDERS */}
            <div>
              <h3 style={{ borderBottom: "2px solid #008080", paddingBottom: "8px", color: "#008080", fontSize: "17px", fontWeight: "bold", marginBottom: "16px" }}>
                🔄 Active Orders
              </h3>
              {studentOrders.filter(o => o.status === "Pending" || o.status === "Preparing" || o.status === "Ready").length === 0 ? (
                <div className="profile-card" style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                  No active pre-orders at the moment.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {studentOrders
                    .filter(o => o.status === "Pending" || o.status === "Preparing" || o.status === "Ready")
                    .map((order) => {
                      const stallName = typeof order.stallId === "object" && order.stallId ? order.stallId.name : "Unknown Stall";
                      const canCancel = order.status === "Pending" || order.status === "Preparing";
                      return (
                        <div key={order._id} className="profile-card" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "20px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                            <div>
                              <strong style={{ fontSize: "16px", color: "#8B0000" }}>{stallName}</strong>
                              <span style={{ fontSize: "12px", color: "#777", display: "block", marginTop: "2px" }}>
                                Order ID: <span style={{ fontFamily: "monospace" }}>{order._id}</span>
                              </span>
                            </div>
                            <div style={{ textAlign: "right", display: "flex", gap: "6px" }}>
                              <span className={`badge badge-status-${order.status.toLowerCase()}`}>
                                {order.status}
                              </span>
                              <span className={`badge badge-ps-${order.paymentStatus.toLowerCase()}`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>
                          
                          {/* PROGRESS TRACKER */}
                          {renderStepTracker(order.status)}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #eee", paddingTop: "12px", marginTop: "4px", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ fontSize: "13px", color: "#555" }}>
                              📅 Date: <strong>{new Date(order.createdAt).toLocaleDateString()}</strong> | ⏰ Pickup: <strong>{order.pickupTime}</strong> | 💳 {order.paymentMethod}
                            </div>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <button 
                                className="btn-sm btn-edit"
                                onClick={() => setSelectedReceipt(order)}
                                style={{ padding: "6px 12px", fontSize: "12.5px" }}
                              >
                                🧾 Receipt
                              </button>
                              <button
                                className="btn-sm btn-danger"
                                disabled={!canCancel}
                                onClick={() => handleCancelOrder(order._id)}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "12.5px",
                                  opacity: canCancel ? 1 : 0.5,
                                  cursor: canCancel ? "pointer" : "not-allowed",
                                  background: canCancel ? "#ffebee" : "#eee",
                                  color: canCancel ? "#c62828" : "#888"
                                }}
                                title={canCancel ? "Cancel this pre-order" : "Cannot cancel once ready or completed"}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* PAST ORDERS */}
            <div>
              <h3 style={{ borderBottom: "2px solid #888", paddingBottom: "8px", color: "#666", fontSize: "17px", fontWeight: "bold", marginBottom: "16px" }}>
                📜 Previous Orders
              </h3>
              {studentOrders.filter(o => o.status === "Completed" || o.status === "Cancelled").length === 0 ? (
                <div className="profile-card" style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                  No previous orders found.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {studentOrders
                    .filter(o => o.status === "Completed" || o.status === "Cancelled")
                    .map((order) => {
                      const stallName = typeof order.stallId === "object" && order.stallId ? order.stallId.name : "Unknown Stall";
                      return (
                        <div key={order._id} className="profile-card" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "20px", opacity: 0.85 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                            <div>
                              <strong style={{ fontSize: "15px", color: "#555" }}>{stallName}</strong>
                              <span style={{ fontSize: "12px", color: "#777", display: "block", marginTop: "2px" }}>
                                Order ID: <span style={{ fontFamily: "monospace" }}>{order._id}</span>
                              </span>
                            </div>
                            <div style={{ textAlign: "right", display: "flex", gap: "6px" }}>
                              <span className={`badge badge-status-${order.status.toLowerCase()}`}>
                                {order.status}
                              </span>
                              <span className={`badge badge-ps-${order.paymentStatus.toLowerCase()}`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #eee", paddingTop: "12px", marginTop: "4px", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ fontSize: "13px", color: "#666" }}>
                              📅 Date: <strong>{new Date(order.createdAt).toLocaleDateString()}</strong> | ⏰ Pickup: <strong>{order.pickupTime}</strong> | 💳 {order.paymentMethod}
                            </div>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <span style={{ marginRight: "10px", fontWeight: "bold", color: "#555" }}>
                                Rs. {order.totalAmount}
                              </span>
                              <button 
                                className="btn-sm btn-edit"
                                onClick={() => setSelectedReceipt(order)}
                                style={{ padding: "6px 12px", fontSize: "12.5px" }}
                              >
                                🧾 Receipt
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* DIGITAL RECEIPT MODAL FOR STUDENT HISTORY */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-content info-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="modal-header" style={{ borderBottom: "none" }}>
              <div style={{ width: "100%", textAlign: "center" }}>
                <span style={{ fontSize: "3rem", display: "block" }}>🧾</span>
                <h3 style={{ margin: "10px 0 0 0", color: "#8B0000" }}>Digital Receipt</h3>
              </div>
              <button className="close-btn" onClick={() => setSelectedReceipt(null)} style={{ position: "absolute", top: "15px", right: "15px" }}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="receipt-box" style={{ background: "#fafafa", border: "1px dashed #ccc", borderRadius: "8px", padding: "20px", fontFamily: "monospace" }}>
                <h4 style={{ textAlign: "center", margin: "0 0 16px 0", letterSpacing: "1px", textTransform: "uppercase" }}>Pre-Order Receipt</h4>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                  <span>Order ID:</span>
                  <strong>{selectedReceipt._id}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                  <span>Date:</span>
                  <strong>{new Date(selectedReceipt.createdAt).toLocaleString()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "12px", borderBottom: "1px dashed #ccc", paddingBottom: "8px" }}>
                  <span>Stall:</span>
                  <strong>{typeof selectedReceipt.stallId === "object" ? selectedReceipt.stallId.name : "Food Stall"}</strong>
                </div>

                <div style={{ marginBottom: "16px", borderBottom: "1px dashed #ccc", paddingBottom: "12px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "6px" }}>Items:</div>
                  {selectedReceipt.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}>
                      <span>{item.name} x{item.quantity}</span>
                      <span>Rs. {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", fontWeight: "bold" }}>
                  <span>Total Amount:</span>
                  <strong>Rs. {selectedReceipt.totalAmount}</strong>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                  <span>Pickup Time:</span>
                  <strong>{selectedReceipt.pickupTime}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                  <span>Payment Mode:</span>
                  <strong>{selectedReceipt.paymentMethod}</strong>
                </div>
                {selectedReceipt.gcashNumber && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span>GCash Number:</span>
                    <strong>{selectedReceipt.gcashNumber}</strong>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "12px" }}>
                  <span>Order Status:</span>
                  <strong style={{ color: "#008080" }}>{selectedReceipt.status}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                  <span>Payment Status:</span>
                  <strong>{selectedReceipt.paymentStatus}</strong>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                <button className="btn-secondary" onClick={() => setSelectedReceipt(null)} style={{ padding: "8px 24px" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
