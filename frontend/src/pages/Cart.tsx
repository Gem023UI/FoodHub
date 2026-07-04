import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getStallDetails } from "../services/stall.service";
import "../styles/Cart.css";

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  productImages: string[];
  nutrition: {
    calories: number | null;
    protein: number | null;
  };
  stallId: string;
  stallName: string;
  isChecked: boolean;
}

interface StallGroup {
  stallId: string;
  stallName: string;
  section?: number;
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
        try {
          const stall = await getStallDetails(item.stallId);
          const paymentMethods: string[] = [];
          if (stall.paymentMethod?.cash?.available) paymentMethods.push("Cash");
          if (stall.paymentMethod?.gcash?.available) paymentMethods.push("GCash");
          if (stall.paymentMethod?.paymaya?.available) paymentMethods.push("Maya");

          groups[item.stallId] = {
            stallId: item.stallId,
            stallName: stall.stallName || item.stallName || "Unknown Stall",
            section: stall.section,
            items: [],
            paymentMethods: paymentMethods.length > 0 ? paymentMethods : ["Cash"],
            paymentDetails: {
              gcashNumber: stall.paymentMethod?.gcash?.phoneNumber || null,
              mayaNumber: stall.paymentMethod?.paymaya?.phoneNumber || null
            }
          };
        } catch {
          groups[item.stallId] = {
            stallId: item.stallId,
            stallName: item.stallName || "Unknown Stall",
            items: [],
            paymentMethods: ["Cash"],
            paymentDetails: { gcashNumber: null, mayaNumber: null }
          };
        }
      }
      groups[item.stallId].items.push(item);
    }

    setStallGroups(groups);

    const stallIds = Object.keys(groups);
    if (stallIds.length === 1) {
      setSelectedStallId(stallIds[0]);
    } else if (stallIds.length === 0) {
      setSelectedStallId(null);
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

  // Selecting a stall checks all of that stall's items and unchecks every other
  // stall's items, since an order can only come from one stall at a time.
  function toggleSelectStall(stallId: string) {
    const updated = cartItems.map(item => ({
      ...item,
      isChecked: item.stallId === stallId
    }));
    setSelectedStallId(stallId);
    saveCart(updated);
  }

  function toggleStallItemsCheck(stallId: string) {
    const group = stallGroups[stallId];
    if (!group) return;
    const allChecked = group.items.every(item => item.isChecked);
    const updated = cartItems.map(item =>
      item.stallId === stallId ? { ...item, isChecked: !allChecked } : item
    );
    saveCart(updated);
  }

  const checkedItems = cartItems.filter(item =>
    item.isChecked && item.stallId === selectedStallId
  );

  const totalAmount = checkedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = checkedItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedStall = selectedStallId ? stallGroups[selectedStallId] : null;
  const stallEntries = Object.entries(stallGroups);

  function handleProceedToCheckout() {
    if (checkedItems.length === 0) {
      setError("Please select at least one item to checkout.");
      return;
    }

    if (!selectedStall) {
      setError("Please select a stall first.");
      return;
    }

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
        <div className="cart-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="cart-page">
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
          <div className="cart-layout">
            {/* ─── LEFT: STALL TABLES (3/5) ─── */}
            <div className="cart-stalls-column">
              {stallEntries.length > 1 && (
                <p className="cart-single-stall-note">
                  <i className="fas fa-info-circle"></i> You can only check out from one stall per order. Selecting a stall deselects items from the others.
                </p>
              )}

              {stallEntries.map(([stallId, group]) => {
                const isSelected = selectedStallId === stallId;
                const groupTotal = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const groupItemCount = group.items.reduce((sum, item) => sum + item.quantity, 0);
                const allChecked = group.items.every(item => item.isChecked);

                return (
                  <div
                    key={stallId}
                    className={`stall-cart-table-wrapper ${isSelected ? "active-stall" : ""}`}
                  >
                    <div className="stall-cart-header">
                      <div className="stall-cart-info">
                        <div>
                          <h3>
                            {group.stallName}
                            {group.section !== undefined && (
                              <span className="stall-cart-section-tag">Section {group.section}</span>
                            )}
                          </h3>
                          <span className="stall-cart-item-count">
                            {groupItemCount} item{groupItemCount === 1 ? "" : "s"} · ₱{groupTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        className={`stall-select-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleSelectStall(stallId)}
                      >
                        {isSelected ? (
                          <><i className="fas fa-check-circle"></i> Ordering from here</>
                        ) : (
                          "Order from this stall"
                        )}
                      </button>
                    </div>

                    <div className="table-wrapper">
                      <table className="cart-table">
                        <thead>
                          <tr>
                            <th className="checkbox-col">
                              <input
                                type="checkbox"
                                checked={isSelected ? allChecked : false}
                                disabled={!isSelected}
                                onChange={() => toggleStallItemsCheck(stallId)}
                              />
                            </th>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Subtotal</th>
                            <th className="actions-col">Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((item) => {
                            const itemSubtotal = item.price * item.quantity;
                            const imageUrl = item.productImages?.[0] || "https://via.placeholder.com/60x60?text=No+Image";

                            return (
                              <tr key={item.productId} className={isSelected && item.isChecked ? "checked" : ""}>
                                <td className="checkbox-col">
                                  <input
                                    type="checkbox"
                                    checked={isSelected && item.isChecked}
                                    disabled={!isSelected}
                                    onChange={() => toggleCheck(item.productId)}
                                  />
                                </td>
                                <td className="product-cell">
                                  <div className="product-cell-content">
                                    <img
                                      src={imageUrl}
                                      alt={item.productName}
                                      className="cart-product-image"
                                    />
                                    <div className="cart-product-info">
                                      <span className="cart-product-name">{item.productName}</span>
                                      {item.nutrition?.calories && (
                                        <span className="cart-product-calories">🔥 {item.nutrition.calories} cal</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="price-cell">₱{item.price.toFixed(2)}</td>
                                <td className="quantity-cell">
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
                                </td>
                                <td className="subtotal-cell">₱{itemSubtotal.toFixed(2)}</td>
                                <td className="actions-col">
                                  <button
                                    className="remove-btn"
                                    onClick={() => removeItem(item.productId)}
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} className="total-label">Total for {group.stallName}</td>
                            <td className="total-amount" colSpan={2}>₱{groupTotal.toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ─── RIGHT: STICKY PAYMENT SUMMARY (2/5) ─── */}
            <div className="cart-summary-column">
              <div className="cart-summary">
                {!selectedStall ? (
                  <div className="summary-empty-state">
                    <i className="fas fa-store"></i>
                    <p>Select a stall on the left to see your order summary and payment options.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="summary-stall-name">{selectedStall.stallName}</h3>

                    <div className="summary-row">
                      <span>Total Items</span>
                      <span>{totalItems}</span>
                    </div>
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>₱{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total to Pay</span>
                      <span>₱{totalAmount.toFixed(2)}</span>
                    </div>

                    {selectedStall.paymentMethods && (
                      <div className="summary-payment-methods">
                        <span className="payment-label">Accepted Payments</span>
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

                    <button
                      className="checkout-btn"
                      onClick={handleProceedToCheckout}
                      disabled={checkedItems.length === 0}
                    >
                      {checkedItems.length === 0
                        ? "Select items to checkout"
                        : `Checkout (${totalItems} item${totalItems === 1 ? "" : "s"})`}
                    </button>

                    <div className="checkout-note">
                      <i className="fas fa-info-circle"></i>
                      <span>Uncheck any item above to leave it out of this order.</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}