import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStallById } from "../lib/api";
import "../styles/Cart.css";

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  photos: string[];
  nutrition: {
    calories: number | null;
    proteinGrams: number | null;
  };
  stallId: string;
  stallName: string;
  isChecked: boolean;
}

interface StallGroup {
  stallId: string;
  stallName: string;
  items: CartItem[];
  paymentMethods?: string[];
  paymentDetails?: {
    gcashNumber: string | null;
    mayaNumber: string | null;
  };
}

interface CartProps {
  token: string;
  onNavigate: (page: string, data?: any) => void;
  onLogout?: () => void;
}

export function Cart({ token, onNavigate, onLogout }: CartProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stallGroups, setStallGroups] = useState<Record<string, StallGroup>>({});
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  function loadCart() {
    setIsLoading(true);
    try {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCartItems(parsed);
        // Group by stall
        groupByStall(parsed);
      }
    } catch (err) {
      console.error("Error loading cart:", err);
      setError("Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  }

  async function groupByStall(items: CartItem[]) {
    const groups: Record<string, StallGroup> = {};
    
    for (const item of items) {
      if (!groups[item.stallId]) {
        // Fetch stall payment methods
        try {
          const stall = await getStallById(item.stallId);
          groups[item.stallId] = {
            stallId: item.stallId,
            stallName: item.stallName,
            items: [],
            paymentMethods: stall?.paymentMethods || ["Cash"],
            paymentDetails: stall?.paymentDetails || { gcashNumber: null, mayaNumber: null }
          };
        } catch {
          groups[item.stallId] = {
            stallId: item.stallId,
            stallName: item.stallName,
            items: [],
            paymentMethods: ["Cash"],
            paymentDetails: { gcashNumber: null, mayaNumber: null }
          };
        }
      }
      groups[item.stallId].items.push(item);
    }
    
    setStallGroups(groups);
    
    // Set first stall as selected if only one stall has items
    const stallIds = Object.keys(groups);
    if (stallIds.length === 1) {
      setSelectedStallId(stallIds[0]);
    }
  }

  function saveCart(items: CartItem[]) {
    localStorage.setItem("cart", JSON.stringify(items));
    setCartItems(items);
    groupByStall(items);
  }

  function updateQuantity(productId: string, newQuantity: number) {
    if (newQuantity < 1) return;
    const updated = cartItems.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    saveCart(updated);
  }

  function toggleCheck(productId: string) {
    const updated = cartItems.map(item =>
      item.productId === productId
        ? { ...item, isChecked: !item.isChecked }
        : item
    );
    saveCart(updated);
  }

  function removeItem(productId: string) {
    const updated = cartItems.filter(item => item.productId !== productId);
    saveCart(updated);
  }

  function clearCart() {
    saveCart([]);
    setSelectedStallId(null);
  }

  function toggleSelectStall(stallId: string) {
    // Uncheck all items from other stalls
    const updated = cartItems.map(item => {
      if (item.stallId === stallId) {
        return { ...item, isChecked: true };
      } else {
        return { ...item, isChecked: false };
      }
    });
    setSelectedStallId(stallId);
    saveCart(updated);
  }

  // Get checked items - only from selected stall
  const checkedItems = cartItems.filter(item => 
    item.isChecked && item.stallId === selectedStallId
  );
  
  const totalAmount = checkedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = checkedItems.reduce((sum, item) => sum + item.quantity, 0);

  // Get selected stall's payment methods
  const selectedStall = selectedStallId ? stallGroups[selectedStallId] : null;

  function handleProceedToCheckout() {
    if (checkedItems.length === 0) {
      setError("Please select at least one item to checkout.");
      return;
    }

    if (!selectedStall) {
      setError("Please select a stall first.");
      return;
    }

    // Navigate to preorder with selected items
    onNavigate("preorder", {
      items: checkedItems,
      stallId: selectedStall.stallId,
      stallName: selectedStall.stallName,
      totalAmount,
      paymentMethods: selectedStall.paymentMethods || ["Cash"],
      paymentDetails: selectedStall.paymentDetails || { gcashNumber: null, mayaNumber: null }
    });
  }

  if (isLoading) {
    return (
      <div className="cart-page">
        <Header onNavigate={onNavigate} token={token} />
        <div className="cart-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Header onNavigate={onNavigate} token={token} />

      <div className="cart-container">
        <div className="cart-header">
          <h1>Your Cart</h1>
          {cartItems.length > 0 && (
            <button className="clear-cart-btn" onClick={clearCart}>
              Clear All
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Browse stalls and add your favorite items!</p>
            <button className="btn-primary" onClick={() => onNavigate("stalls")}>
              Browse Stalls
            </button>
          </div>
        ) : (
          <>
            {/* Stall Selection */}
            <div className="stall-selection">
              <h3>Select a stall to checkout</h3>
              <div className="stall-options">
                {Object.entries(stallGroups).map(([stallId, group]) => {
                  const isSelected = selectedStallId === stallId;
                  const itemCount = group.items.reduce((sum, item) => sum + item.quantity, 0);
                  
                  return (
                    <button
                      key={stallId}
                      className={`stall-option ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleSelectStall(stallId)}
                    >
                      <div className="stall-option-name">{group.stallName}</div>
                      <div className="stall-option-count">{itemCount} items</div>
                      {isSelected && (
                        <div className="stall-option-check">✓</div>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedStall && selectedStall.paymentMethods && (
                <div className="stall-payment-info">
                  <span className="payment-label">Accepted Payments:</span>
                  <div className="payment-badges">
                    {selectedStall.paymentMethods.map(method => (
                      <span key={method} className="payment-badge">
                        {method}
                        {method === "GCash" && selectedStall.paymentDetails?.gcashNumber && (
                          <span className="payment-number">({selectedStall.paymentDetails.gcashNumber})</span>
                        )}
                        {method === "Maya" && selectedStall.paymentDetails?.mayaNumber && (
                          <span className="payment-number">({selectedStall.paymentDetails.mayaNumber})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="cart-items">
              {selectedStallId && stallGroups[selectedStallId]?.items.map((item) => (
                <div key={item.productId} className="cart-item">
                  <div className="cart-item-checkbox">
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={() => toggleCheck(item.productId)}
                    />
                  </div>
                  <div className="cart-item-image">
                    <img
                      src={item.photos?.[0] || "https://via.placeholder.com/80x80?text=No+Image"}
                      alt={item.productName}
                    />
                  </div>
                  <div className="cart-item-info">
                    <h4>{item.productName}</h4>
                    <div className="cart-item-meta">
                      <span className="item-price">₱{item.price.toFixed(2)}</span>
                      {item.nutrition?.calories && (
                        <span className="item-calories">🔥 {item.nutrition.calories} cal</span>
                      )}
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.productId)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Selected Stall:</span>
                <span>{selectedStall?.stallName || "None selected"}</span>
              </div>
              <div className="summary-row">
                <span>Total Items:</span>
                <span>{totalItems}</span>
              </div>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₱{totalAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>₱{totalAmount.toFixed(2)}</span>
              </div>
              <button
                className="checkout-btn"
                onClick={handleProceedToCheckout}
                disabled={checkedItems.length === 0 || !selectedStallId}
              >
                {checkedItems.length === 0
                  ? "Select items to checkout"
                  : `Checkout (${totalItems} items)`}
              </button>
              {checkedItems.length > 0 && selectedStall?.paymentMethods && (
                <div className="checkout-note">
                  <i className="fas fa-info-circle"></i>
                  <span>
                    Available payments: {selectedStall.paymentMethods.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}