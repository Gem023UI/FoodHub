import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { createOrder } from "../lib/api";
import "../styles/Preorder.css";

interface PreorderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  photos: string[];
  nutrition: {
    calories: number | null;
    proteinGrams: number | null;
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
  
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "GCash" | "Maya">("Cash");
  const [gcashNumber, setGcashNumber] = useState("");
  const [mayaNumber, setMayaNumber] = useState("");
  const [pickupTime, setPickupTime] = useState("");
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
      
      // Set default payment method to first available
      if (preorderData.paymentMethods && preorderData.paymentMethods.length > 0) {
        setPaymentMethod(preorderData.paymentMethods[0] as "Cash" | "GCash" | "Maya");
      }
    }

    // Set default pickup time to 30 minutes from now
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const timeString = now.toTimeString().slice(0, 5);
    setPickupTime(timeString);
  }, [preorderData]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Update GCash/Maya number when payment method changes
  useEffect(() => {
    if (paymentMethod === "GCash" && paymentDetails.gcashNumber) {
      setGcashNumber(paymentDetails.gcashNumber);
    } else if (paymentMethod === "Maya" && paymentDetails.mayaNumber) {
      setMayaNumber(paymentDetails.mayaNumber);
    }
  }, [paymentMethod, paymentDetails]);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!pickupTime) {
      setError("Please select a pickup time.");
      setIsLoading(false);
      return;
    }

    // Validate based on payment method
    if (paymentMethod === "GCash" && !gcashNumber) {
      setError("Please enter your GCash number.");
      setIsLoading(false);
      return;
    }
    
    if (paymentMethod === "Maya" && !mayaNumber) {
      setError("Please enter your Maya number.");
      setIsLoading(false);
      return;
    }

    try {
      const orderInput = {
        stallId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        paymentMethod,
        gcashNumber: paymentMethod === "GCash" ? gcashNumber : undefined,
        mayaNumber: paymentMethod === "Maya" ? mayaNumber : undefined,
        pickupTime
      };

      const result = await createOrder(token, orderInput);
      
      setOrderId(result.order._id);
      setOrderPlaced(true);
      setSuccess("Order placed successfully!");

      // Clear cart after successful order
      localStorage.removeItem("cart");

      // If online payment, simulate payment URL
      if (paymentMethod === "GCash" || paymentMethod === "Maya") {
        // In production, this would come from PayMongo
        setPaymentUrl("https://checkout.paymongo.com/checkout/session");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  }

  if (!preorderData) {
    return (
      <div className="preorder-page">
        <Header onNavigate={onNavigate} token={token} />
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
        <Header onNavigate={onNavigate} token={token} />
        
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
              <span>{paymentMethod}</span>
            </div>
            <div className="order-detail-row">
              <span>Pickup:</span>
              <span>{pickupTime}</span>
            </div>
          </div>

          {(paymentMethod === "GCash" || paymentMethod === "Maya") && paymentUrl && (
            <div className="payment-section">
              <h3>Complete Your Payment</h3>
              <p>Click the button below to complete your payment via {paymentMethod}.</p>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="payment-btn"
              >
                Pay with {paymentMethod}
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
            <button className="btn-secondary" onClick={() => onNavigate("orders")}>
              View Orders
            </button>
          </div>
        </div>

        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const availablePaymentMethods = paymentMethods.filter(m => 
    m === "Cash" || m === "GCash" || m === "Maya"
  );

  return (
    <div className="preorder-page">
      <Header onNavigate={onNavigate} token={token} />

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
                      src={item.photos?.[0] || "https://via.placeholder.com/60x60?text=No+Image"}
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
                {availablePaymentMethods.includes("Cash") && (
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Cash"
                      checked={paymentMethod === "Cash"}
                      onChange={(e) => setPaymentMethod(e.target.value as "Cash")}
                    />
                    <span className="payment-label">💵 Cash</span>
                  </label>
                )}
                {availablePaymentMethods.includes("GCash") && (
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="GCash"
                      checked={paymentMethod === "GCash"}
                      onChange={(e) => setPaymentMethod(e.target.value as "GCash")}
                    />
                    <span className="payment-label">📱 GCash</span>
                  </label>
                )}
                {availablePaymentMethods.includes("Maya") && (
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Maya"
                      checked={paymentMethod === "Maya"}
                      onChange={(e) => setPaymentMethod(e.target.value as "Maya")}
                    />
                    <span className="payment-label">📱 Maya</span>
                  </label>
                )}
              </div>
            </div>

            {paymentMethod === "GCash" && (
              <div className="form-group">
                <label>GCash Number</label>
                <input
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  value={gcashNumber}
                  onChange={(e) => setGcashNumber(e.target.value)}
                  required
                />
                <p className="field-help">
                  Enter your GCash registered mobile number.
                </p>
              </div>
            )}

            {paymentMethod === "Maya" && (
              <div className="form-group">
                <label>Maya Number</label>
                <input
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  value={mayaNumber}
                  onChange={(e) => setMayaNumber(e.target.value)}
                  required
                />
                <p className="field-help">
                  Enter your Maya registered mobile number.
                </p>
              </div>
            )}

            <div className="form-group">
              <label>Pickup Time</label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                required
                min={new Date().toTimeString().slice(0, 5)}
              />
              <p className="field-help">
                Orders are typically ready in 20-30 minutes.
              </p>
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