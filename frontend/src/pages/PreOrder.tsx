import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { createOrder } from "../services/order.service";
import "../styles/Preorder.css";

interface PreorderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  productImages: string[];
  nutrition: {
    calories: number | null;
    protein: number | null;
  };
}

interface PreorderProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  preorderData?: {
    items: PreorderItem[];
    stallId: string;
    stallName: string;
    totalAmount: number;
    paymentMethods?: string[];
    paymentDetails?: {
      gcashNumber: string | null;
      mayaNumber: string | null;
    };
  };
}

export function Preorder({ token, onNavigate, onLogout, preorderData }: PreorderProps) {
  const [items, setItems] = useState<PreorderItem[]>([]);
  const [stallId, setStallId] = useState<string>("");
  const [stallName, setStallName] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["Cash"]);
  const [paymentDetails, setPaymentDetails] = useState<{
    gcashNumber: string | null;
    mayaNumber: string | null;
  }>({ gcashNumber: null, mayaNumber: null });
  
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash" | "paymaya">("cash");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (preorderData) {
      setItems(preorderData.items);
      setStallId(preorderData.stallId);
      setStallName(preorderData.stallName);
      setTotalAmount(preorderData.totalAmount);
      setPaymentMethods(preorderData.paymentMethods || ["Cash"]);
      setPaymentDetails(preorderData.paymentDetails || { gcashNumber: null, mayaNumber: null });
      
      const methodMap: Record<string, "cash" | "gcash" | "paymaya"> = {
        "Cash": "cash",
        "GCash": "gcash",
        "Maya": "paymaya"
      };
      if (preorderData.paymentMethods && preorderData.paymentMethods.length > 0) {
        setPaymentMethod(methodMap[preorderData.paymentMethods[0]] || "cash");
      }
    }
  }, [preorderData]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const methodToDisplay: Record<string, string> = {
    "cash": "Cash",
    "gcash": "GCash",
    "paymaya": "Maya"
  };

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!stallId) {
      setError("No stall selected. Please go back and try again.");
      setIsLoading(false);
      return;
    }

    if (items.length === 0) {
      setError("No items in your order.");
      setIsLoading(false);
      return;
    }

    try {
      console.log("📦 Order payload:", { 
        stallId, 
        itemsCount: items.length, 
        paymentMethod
      });

      const orderInput = {
        stallId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        paymentMethod: paymentMethod
      };

      const result = await createOrder(token, orderInput);
      
      setOrderId(result.order._id);
      setOrderPlaced(true);
      setSuccess("Order placed successfully!");

      localStorage.removeItem("cart");

      if (paymentMethod === "gcash" || paymentMethod === "paymaya") {
        setPaymentUrl("https://checkout.paymongo.com/checkout/session");
      }
    } catch (err) {
      console.error("❌ Order error:", err);
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  }

  if (!preorderData) {
    return (
      <div className="preorder-page">
        <div className="preorder-error">
          <h2>No items to checkout</h2>
          <p>Please add items to your cart first.</p>
          <button className="btn-primary" onClick={() => onNavigate("stalls")}>
            Browse Stalls
          </button>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="preorder-page">        
        <div className="preorder-success">
          <div className="success-icon">✅</div>
          <h2>Order Placed Successfully!</h2>
          <p className="order-id">Order ID: #{orderId?.slice(-6).toUpperCase()}</p>
          
          <div className="order-details-summary">
            <div className="order-detail-row">
              <span>Stall:</span>
              <span>{stallName}</span>
            </div>
            <div className="order-detail-row">
              <span>Items:</span>
              <span>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
            </div>
            <div className="order-detail-row">
              <span>Total:</span>
              <span>₱{totalAmount.toFixed(2)}</span>
            </div>
            <div className="order-detail-row">
              <span>Payment:</span>
              <span>{methodToDisplay[paymentMethod]}</span>
            </div>
          </div>

          {(paymentMethod === "gcash" || paymentMethod === "paymaya") && paymentUrl && (
            <div className="payment-section">
              <h3>Complete Your Payment</h3>
              <p>Click the button below to complete your payment via {methodToDisplay[paymentMethod]}.</p>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="payment-btn"
              >
                Pay with {methodToDisplay[paymentMethod]}
              </a>
              <p className="payment-note">
                After payment, you'll receive a confirmation email.
              </p>
            </div>
          )}

          <div className="success-actions">
            <button className="btn-primary" onClick={() => onNavigate("home")}>
              Go Home
            </button>
            <button className="btn-secondary" onClick={() => onNavigate("profile")}>
              View Orders
            </button>
          </div>
        </div>

        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const availablePaymentMethods = paymentMethods.map(m => {
    const map: Record<string, "cash" | "gcash" | "paymaya"> = {
      "Cash": "cash",
      "GCash": "gcash",
      "Maya": "paymaya"
    };
    return map[m];
  }).filter(Boolean);

  return (
    <div className="preorder-page">
      <div className="preorder-container">
        <div className="preorder-header">
          <button className="btn-back" onClick={() => onNavigate("cart")}>
            ← Back to Cart
          </button>
          <h1>Checkout</h1>
          <p>{stallName}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="preorder-content">
          <div className="order-items-section">
            <h3>Order Items</h3>
            <div className="order-items-list">
              {items.map((item) => (
                <div key={item.productId} className="order-item">
                  <div className="order-item-image">
                    <img
                      src={item.productImages?.[0] || "https://via.placeholder.com/60x60?text=No+Image"}
                      alt={item.productName}
                    />
                  </div>
                  <div className="order-item-info">
                    <h4>{item.productName}</h4>
                    <span className="order-item-price">₱{item.price.toFixed(2)}</span>
                  </div>
                  <div className="order-item-quantity">
                    × {item.quantity}
                  </div>
                  <div className="order-item-subtotal">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="order-total">
              <span>Total:</span>
              <span className="total-amount">₱{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <form className="checkout-form" onSubmit={handlePlaceOrder}>
            <h3>Payment Details</h3>

            <div className="form-group">
              <label>Payment Method</label>
              <div className="payment-methods">
                {availablePaymentMethods.includes("cash") && (
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value as "cash")}
                    />
                    <span className="payment-label">💵 Cash</span>
                  </label>
                )}
                {availablePaymentMethods.includes("gcash") && (
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="gcash"
                      checked={paymentMethod === "gcash"}
                      onChange={(e) => setPaymentMethod(e.target.value as "gcash")}
                    />
                    <span className="payment-label">📱 GCash</span>
                  </label>
                )}
                {availablePaymentMethods.includes("paymaya") && (
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paymaya"
                      checked={paymentMethod === "paymaya"}
                      onChange={(e) => setPaymentMethod(e.target.value as "paymaya")}
                    />
                    <span className="payment-label">📱 Maya</span>
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="place-order-btn"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : `Place Order • ₱${totalAmount.toFixed(2)}`}
            </button>
          </form>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

// Add default export at the bottom
export default Preorder;