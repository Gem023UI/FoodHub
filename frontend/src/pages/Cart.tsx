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
  stallPicture?: string | null;
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
          const paymentMethods = [];
          if (stall.paymentMethod?.cash?.available) paymentMethods.push("Cash");
          if (stall.paymentMethod?.gcash?.available) paymentMethods.push("GCash");
          if (stall.paymentMethod?.paymaya?.available) paymentMethods.push("Maya");
          
          groups[item.stallId] = {
            stallId: item.stallId,
            stallName: item.stallName,
            stallPicture: stall.stallPicture || null,
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
            stallName: item.stallName,
            stallPicture: null,
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

  const checkedItems = cartItems.filter(item => 
    item.isChecked && item.stallId === selectedStallId
  );
  
  const totalAmount = checkedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = checkedItems.reduce((sum, item) => sum + item.quantity, 0);
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

            {/* Cart Items Table - One table per stall */}
            {Object.entries(stallGroups).map(([stallId, group]) => {
              const isSelected = selectedStallId === stallId;
              const groupTotal = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              
              return (
                <div key={stallId} className="stall-cart-table-wrapper">
                  <div className="stall-cart-header">
                    <div className="stall-cart-info">
                      {group.stallPicture && (
                        <img 
                          src={group.stallPicture} 
                          alt={group.stallName} 
                          className="stall-cart-avatar"
                        />
                      )}
                      <div>
                        <h3>{group.stallName}</h3>
                        <span className="stall-cart-item-count">
                          {group.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </span>
                      </div>
                    </div>
                    <div className="stall-cart-total">
                      <span>Total: ₱{groupTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="table-wrapper">
                    <table className="cart-table">
                      <thead>
                        <tr>
                          <th className="checkbox-col">
                            <input
                              type="checkbox"
                              checked={isSelected ? group.items.every(item => item.isChecked) : false}
                              onChange={() => {
                                if (isSelected) {
                                  const allChecked = group.items.every(item => item.isChecked);
                                  const updated = cartItems.map(item => {
                                    if (item.stallId === stallId) {
                                      return { ...item, isChecked: !allChecked };
                                    }
                                    return item;
                                  });
                                  saveCart(updated);
                                } else {
                                  toggleSelectStall(stallId);
                                }
                              }}
                            />
                          </th>
                          <th>Stall</th>  {/* ← ADD THIS LINE */}
                          <th>Product</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Subtotal</th>
                          <th className="actions-col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item) => {
                          const itemSubtotal = item.price * item.quantity;
                          const imageUrl = item.productImages?.[0] || "https://via.placeholder.com/60x60?text=No+Image";
                          
                          return (
                            <tr key={item.productId} className={item.isChecked ? "checked" : ""}>
                              <td className="checkbox-col">
                                <input
                                  type="checkbox"
                                  checked={item.isChecked}
                                  onChange={() => toggleCheck(item.productId)}
                                  disabled={!isSelected}
                                />
                              </td>
                              <td className="stall-cell">{group.stallName}</td>  {/* ← ADD THIS LINE */}
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
                          <td colSpan={4} className="total-label">Total for {group.stallName}</td>
                          <td className="total-amount">₱{groupTotal.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Cart Summary */}
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