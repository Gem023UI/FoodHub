import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { createOrder, uploadPaymentProof, OverBudgetError, PickupTimeOutsideHoursError, StallClosedError } from "../services/order.service";
import { getStudentBudgetCaps } from "../services/budget.service";
import { getStallCard } from "../services/stall.service";
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

export function Preorder({ token, onNavigate, preorderData }: PreorderProps) {
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
  const [pickupTime, setPickupTime] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [currentBudget, setCurrentBudget] = useState<number | null>(null);
  const [showOverBudgetConfirm, setShowOverBudgetConfirm] = useState(false);
  const [pendingOverBudgetInfo, setPendingOverBudgetInfo] = useState<{ currentBudget: number; totalAmount: number } | null>(null);

  const [stallClosed, setStallClosed] = useState(false);
  const [isCheckingStall, setIsCheckingStall] = useState(true);
  const [showPickupTimeModal, setShowPickupTimeModal] = useState(false);
  const [pickupTimeHours, setPickupTimeHours] = useState<{ openTime: string; closingTime: string } | null>(null);

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
    async function checkStallStatus() {
      if (!preorderData?.stallId) {
        setIsCheckingStall(false);
        return;
      }
      setIsCheckingStall(true);
      try {
        const stallCard = await getStallCard(preorderData.stallId);
        if (!stallCard.status) {
          setStallClosed(true);
        }
      } catch (err) {
        console.error("Error checking stall status:", err);
      } finally {
        setIsCheckingStall(false);
      }
    }
    checkStallStatus();
  }, [preorderData?.stallId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    async function loadCurrentBudget() {
      try {
        const caps = await getStudentBudgetCaps(token);
        const now = new Date();
        const active = caps.find(c =>
          c.status === "active" &&
          new Date(c.startDate) <= now &&
          new Date(c.endDate) >= now
        );
        setCurrentBudget(active ? active.currentBudget : null);
      } catch (err) {
        console.error("Error loading current budget:", err);
      }
    }
    loadCurrentBudget();
  }, [token]);

  const methodToDisplay: Record<string, string> = {
    "cash": "Cash",
    "gcash": "GCash",
    "paymaya": "Maya"
  };

  const requiresProof = paymentMethod === "gcash" || paymentMethod === "paymaya";

  function handlePaymentMethodChange(method: "cash" | "gcash" | "paymaya") {
    setPaymentMethod(method);
    // Reset proof state when switching methods
    setReferenceNumber("");
    setProofFile(null);
    setProofPreviewUrl(null);
    setUploadedProofUrl(null);
  }

  function handleProofFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setProofFile(file);
    setUploadedProofUrl(null); // invalidate cached upload if file changes

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProofPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setProofPreviewUrl(null);
    }
  }

  async function submitOrder(confirmOverBudget: boolean) {
    setIsLoading(true);
    setError(null);

    try {
      let proofUrl = uploadedProofUrl;

      if (requiresProof && proofFile && !proofUrl) {
        proofUrl = await uploadPaymentProof(token, proofFile);
        setUploadedProofUrl(proofUrl);
      }

      const orderInput = {
        stallId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        paymentMethod,
        pickupTime,
        confirmOverBudget,
        ...(requiresProof
          ? { referenceNumber: referenceNumber.trim(), proofOfPaymentUrl: proofUrl || undefined }
          : {})
      };

      const result = await createOrder(token, orderInput);

      setOrderId(result.order._id);
      setOrderPlaced(true);
      setSuccess("Order placed successfully!");
      setShowOverBudgetConfirm(false);
      setPendingOverBudgetInfo(null);
      if (typeof result.currentBudget === "number") {
        setCurrentBudget(result.currentBudget);
      }

      localStorage.removeItem("cart");
    } catch (err) {
      if (err instanceof OverBudgetError) {
        setPendingOverBudgetInfo({ currentBudget: err.currentBudget, totalAmount: err.totalAmount });
        setShowOverBudgetConfirm(true);
      } else if (err instanceof PickupTimeOutsideHoursError) {
        setPickupTimeHours({ openTime: err.openTime, closingTime: err.closingTime });
        setShowPickupTimeModal(true);
      } else if (err instanceof StallClosedError) {
        setStallClosed(true);
      } else {
        console.error("❌ Order error:", err);
        setError(err instanceof Error ? err.message : "Failed to place order");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!stallId) {
      setError("No stall selected. Please go back and try again.");
      return;
    }

    if (items.length === 0) {
      setError("No items in your order.");
      return;
    }

    if (!pickupTime) {
      setError("Please select a pickup time.");
      return;
    }

    if (requiresProof) {
      if (!referenceNumber.trim()) {
        setError("Please enter the reference number from your payment transaction.");
        return;
      }
      if (!proofFile) {
        setError("Please upload a screenshot of your payment confirmation.");
        return;
      }
    }

    await submitOrder(false);
  }

  async function handleConfirmOverBudget() {
    await submitOrder(true);
  }

  if (isCheckingStall) {
    return (
      <div className="preorder-page">
        <div className="vendor-loading" style={{ display: "flex", justifyContent: "center", padding: "80px 0", flex: 1 }}>
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
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
              <span>Pickup Time:</span>
              <span>{pickupTime}</span>
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

          {requiresProof && (
            <div className="payment-section">
              <h3>Payment Submitted</h3>
              <p>
                Your {methodToDisplay[paymentMethod]} payment (Ref: {referenceNumber}) is being
                verified by the vendor. You'll see the payment status update in your order history.
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

            {currentBudget !== null && (
              <div className="current-budget-display">
                <span>Current Budget:</span>
                <span className={currentBudget < 0 ? "current-budget-negative" : "current-budget-value"}>
                  ₱{currentBudget.toFixed(2)}
                </span>
              </div>
            )}

            <div className="form-group">
              <label>Pickup Time</label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                required
              />
              <p className="field-help">Let the vendor know when you'll be available to pick up your order.</p>
            </div>

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
                      onChange={() => handlePaymentMethodChange("cash")}
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
                      onChange={() => handlePaymentMethodChange("gcash")}
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
                      onChange={() => handlePaymentMethodChange("paymaya")}
                    />
                    <span className="payment-label">📱 Maya</span>
                  </label>
                )}
              </div>
            </div>

            {requiresProof && (
              <div className="payment-proof-section">
                {paymentMethod === "gcash" && paymentDetails.gcashNumber && (
                  <p className="field-help">Send payment to GCash number: <strong>{paymentDetails.gcashNumber}</strong></p>
                )}
                {paymentMethod === "paymaya" && paymentDetails.mayaNumber && (
                  <p className="field-help">Send payment to Maya number: <strong>{paymentDetails.mayaNumber}</strong></p>
                )}

                <div className="form-group">
                  <label>Reference Number</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. 1234567890123"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Proof of Payment</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofFileChange}
                    required
                  />
                  <p className="field-help">Upload a screenshot of your payment confirmation.</p>
                  {proofPreviewUrl && (
                    <div className="proof-preview">
                      <img src={proofPreviewUrl} alt="Proof of payment preview" />
                    </div>
                  )}
                </div>
              </div>
            )}

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

      {showOverBudgetConfirm && pendingOverBudgetInfo && (
        <div className="preorder-modal-overlay" onClick={() => !isLoading && setShowOverBudgetConfirm(false)}>
          <div className="preorder-modal" onClick={(e) => e.stopPropagation()}>
            <h3>You've Reached Your Budget Limit</h3>
            <p>
              This order totals ₱{pendingOverBudgetInfo.totalAmount.toFixed(2)}, which exceeds your remaining
              budget of ₱{pendingOverBudgetInfo.currentBudget.toFixed(2)}. Placing this order will put your
              budget into the negative. Are you sure you want to continue?
            </p>
            <div className="preorder-modal-actions">
              <button className="btn-secondary" onClick={() => setShowOverBudgetConfirm(false)} disabled={isLoading}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleConfirmOverBudget} disabled={isLoading}>
                {isLoading ? "Processing..." : "Yes, Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {stallClosed && (
        <div className="preorder-modal-overlay">
          <div className="preorder-modal">
            <h3>This Stall is Currently Closed</h3>
            <p>
              {stallName || "This stall"} is not accepting orders right now. Please check back
              when the stall is open, or explore other available stalls.
            </p>
            <div className="preorder-modal-actions">
              <button className="btn-primary" onClick={() => onNavigate("home")}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {showPickupTimeModal && pickupTimeHours && (
        <div className="preorder-modal-overlay" onClick={() => !isLoading && setShowPickupTimeModal(false)}>
          <div className="preorder-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Pickup Time Outside Store Hours</h3>
            <p>
              This stall is only open from <strong>{pickupTimeHours.openTime}</strong> to{" "}
              <strong>{pickupTimeHours.closingTime}</strong>. Please choose a pickup time within
              these hours.
            </p>
            <div className="preorder-modal-actions">
              <button className="btn-primary" onClick={() => setShowPickupTimeModal(false)}>
                Adjust Pickup Time
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

export default Preorder;