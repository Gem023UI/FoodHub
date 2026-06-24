import { useEffect, useMemo, useState } from "react";
import { fetchStallDetails, placePreOrder, type MenuItemSummary, type StallSummary } from "../lib/api";

interface MenuProps {
  token?: string | null;
  stallId: string;
  stallName: string;
  onBack: () => void;
  onRequireLogin?: () => void;
}

export function Menu({ token, stallId, stallName, onBack, onRequireLogin }: MenuProps) {
  const [menuItems, setMenuItems] = useState<MenuItemSummary[]>([]);
  const [stall, setStall] = useState<StallSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Modal state for viewing details
  const [selectedItem, setSelectedItem] = useState<MenuItemSummary | null>(null);

  // Cart States
  const [cart, setCart] = useState<Array<{ menuItem: MenuItemSummary; quantity: number }>>([]);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "GCash">("Cash");
  const [pickupTime, setPickupTime] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // New Modals States
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [gcashNumber, setGcashNumber] = useState("");
  const [placedOrderDetails, setPlacedOrderDetails] = useState<any | null>(null);

  const handleAddToCart = (item: MenuItemSummary) => {
    if (!token) {
      if (window.confirm("You must be logged in to add items to your cart. Would you like to login now?")) {
        if (onRequireLogin) onRequireLogin();
      }
      return;
    }
    setCart(prevCart => {
      const existing = prevCart.find(ci => ci.menuItem._id === item._id);
      if (existing) {
        return prevCart.map(ci =>
          ci.menuItem._id === item._id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prevCart, { menuItem: item, quantity: 1 }];
    });
  };

  const updateCartQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(ci => ci.menuItem._id !== itemId));
    } else {
      setCart(prev => prev.map(ci =>
        ci.menuItem._id === itemId ? { ...ci, quantity: newQty } : ci
      ));
    }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);
  }, [cart]);

  const handlePlaceOrder = async (gcashNum?: string) => {
    if (!pickupTime) {
      setError("Please select a pickup time.");
      return;
    }
    setIsPlacingOrder(true);
    setError(null);
    try {
      const itemsInput = cart.map(ci => ({
        menuItemId: ci.menuItem._id,
        quantity: ci.quantity
      }));
      const res = await placePreOrder(token!, {
        stallId,
        items: itemsInput,
        paymentMethod,
        gcashNumber: gcashNum,
        pickupTime
      });
      setPlacedOrderDetails(res.order);
      setCart([]);
      setIsCartModalOpen(false);
      setIsCheckoutModalOpen(false);
      setGcashNumber("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleProceedCheckout = () => {
    if (!pickupTime) {
      setError("Please select a pickup time.");
      return;
    }
    if (paymentMethod === "GCash") {
      setIsCartModalOpen(false);
      setIsCheckoutModalOpen(true);
    } else {
      void handlePlaceOrder();
    }
  };

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "GCash" && !gcashNumber) {
      setError("GCash mobile number is required.");
      return;
    }
    void handlePlaceOrder(gcashNumber);
  };

  useEffect(() => {
    let active = true;

    async function loadMenu() {
      try {
        setIsLoading(true);
        const data = await fetchStallDetails(stallId, token ?? undefined);
        if (!active) {
          return;
        }
        setMenuItems(data.menuItems);
        setStall(data.stall);
        if (data.menuItems.length > 0) {
          setSelectedCategory(data.menuItems[0].category);
        }
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        setIsLoading(false);
      }
    }

    void loadMenu();

    return () => {
      active = false;
    };
  }, [stallId, token]);

  const categories = useMemo(() => {
    return Array.from(new Set(menuItems.map((item) => item.category)));
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (!selectedCategory) {
      return menuItems;
    }
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  return (
    <div className="menu-container">
      <div className="menu-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>{stallName}</h1>
      </div>

      {stall && (
        <div className="menu-stall-detail-card">
          <div className="menu-stall-detail-image-wrapper">
            {stall.photoUrl ? (
              <img src={stall.photoUrl} alt={stall.name} className="menu-stall-detail-image" />
            ) : (
              <div className="menu-stall-detail-placeholder">🏪</div>
            )}
          </div>
          <div className="menu-stall-detail-info">
            <div className="menu-stall-detail-badge">{stall.category || "General"}</div>
            <h2>{stall.name}</h2>
            {stall.description && <p className="menu-stall-detail-desc">{stall.description}</p>}
            
            <div className="menu-stall-detail-meta">
              <span className="meta-item">📍 <strong>Location:</strong> {stall.location}</span>
              {stall.openingHours && (
                <span className="meta-item">⏰ <strong>Opening Hours:</strong> {stall.openingHours}</span>
              )}
              {typeof stall.vendorId === "object" && stall.vendorId && (
                <span className="meta-item">
                  👤 <strong>Owner:</strong> {stall.vendorId.name} ({stall.vendorId.email})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="categories-row">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-button ${selectedCategory === category ? "active" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="menu-content-layout">
        <div className="menu-items-section">
          {isLoading ? (
            <div className="menu-loading">Loading menu...</div>
          ) : error ? (
            <div className="menu-error">{error}</div>
          ) : filteredItems.length === 0 ? (
            <div className="menu-empty">No items available</div>
          ) : (
            <div className="menu-grid">
              {filteredItems.map((item) => (
                <div key={item._id} className="menu-item-card">
                  {item.photoUrl ? (
                    <img 
                      src={item.photoUrl} 
                      alt={item.name} 
                      className="menu-item-image" 
                      style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "6px 6px 0 0" }} 
                    />
                  ) : (
                    <div className="item-image-placeholder" />
                  )}
                  <h3>{item.name}</h3>
                  <p className="item-availability">
                    Available: <strong>{item.isAvailable ? "Yes" : "No"}</strong>
                  </p>
                  
                  <div className="item-footer" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <span className="item-price" style={{ fontWeight: "bold", fontSize: "16px", color: "#008080" }}>
                        Rs. {item.price}
                      </span>
                      <button
                        type="button"
                        className="btn-view-details-inline"
                        onClick={() => setSelectedItem(item)}
                      >
                        👁️ View Details
                      </button>
                    </div>
                    <button
                      className={`add-to-cart-button ${!item.isAvailable ? "disabled" : ""}`}
                      disabled={!item.isAvailable}
                      style={{ width: "100%" }}
                      onClick={() => handleAddToCart(item)}
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details View Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content info-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>🍜 Product Information</h3>
              <button className="close-btn" onClick={() => setSelectedItem(null)}>&times;</button>
            </div>
            
            <div className="modal-body">
              {selectedItem.photoUrl && (
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <img 
                    src={selectedItem.photoUrl} 
                    alt={selectedItem.name} 
                    style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px", objectFit: "cover" }} 
                  />
                </div>
              )}
              
              <h2 style={{ margin: "0 0 10px 0", color: "#8B0000" }}>{selectedItem.name}</h2>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#008080", marginBottom: "16px" }}>
                Price: Rs. {selectedItem.price}
              </div>
              
              <div style={{ marginBottom: "16px" }}>
                <strong style={{ display: "block", marginBottom: "4px", color: "#333" }}>Description:</strong>
                <p style={{ margin: 0, color: "#666", fontSize: "14px", lineHeight: "1.5" }}>
                  {selectedItem.description || "No description available for this item."}
                </p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ display: "block", marginBottom: "6px", color: "#333" }}>🌾 Ingredients:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedItem.ingredients && selectedItem.ingredients.length > 0 ? (
                    selectedItem.ingredients.map((ing: string, idx: number) => (
                      <span 
                        key={idx} 
                        style={{ background: "#e0f2f1", color: "#00796b", padding: "3px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }}
                      >
                        {ing.trim()}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#888", fontSize: "13px" }}>No ingredients listed</span>
                  )}
                </div>
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <strong style={{ display: "block", marginBottom: "6px", color: "#333" }}>⚠️ Allergens:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedItem.allergens && selectedItem.allergens.length > 0 ? (
                    selectedItem.allergens.map((all: string, idx: number) => (
                      <span 
                        key={idx} 
                        style={{ background: "#ffebee", color: "#c62828", padding: "3px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }}
                      >
                        {all.trim()}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#2e7d32", background: "#e8f5e9", padding: "3px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }}>
                      No allergens detected
                    </span>
                  )}
                </div>
              </div>

              <fieldset className="nutrition-fieldset" style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "12px 16px" }}>
                <legend style={{ padding: "0 8px", fontWeight: "bold", color: "#008080" }}>🍎 Nutritional Facts</legend>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", textAlign: "center" }}>
                  <div style={{ background: "#fcfcfc", padding: "6px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase" }}>Calories</div>
                    <strong style={{ fontSize: "14px", color: "#333", display: "block", marginTop: "4px" }}>
                      {selectedItem.nutrition?.calories ?? "0"} kcal
                    </strong>
                  </div>
                  <div style={{ background: "#fcfcfc", padding: "6px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase" }}>Protein</div>
                    <strong style={{ fontSize: "14px", color: "#333", display: "block", marginTop: "4px" }}>
                      {selectedItem.nutrition?.proteinGrams ?? "0"}g
                    </strong>
                  </div>
                  <div style={{ background: "#fcfcfc", padding: "6px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase" }}>Carbs</div>
                    <strong style={{ fontSize: "14px", color: "#333", display: "block", marginTop: "4px" }}>
                      {selectedItem.nutrition?.carbsGrams ?? "0"}g
                    </strong>
                  </div>
                  <div style={{ background: "#fcfcfc", padding: "6px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase" }}>Fat</div>
                    <strong style={{ fontSize: "14px", color: "#333", display: "block", marginTop: "4px" }}>
                      {selectedItem.nutrition?.fatGrams ?? "0"}g
                    </strong>
                  </div>
                  <div style={{ background: "#fcfcfc", padding: "6px", borderRadius: "4px", border: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "11px", color: "#777", textTransform: "uppercase" }}>Sodium</div>
                    <strong style={{ fontSize: "14px", color: "#333", display: "block", marginTop: "4px" }}>
                      {selectedItem.nutrition?.sodiumMilligrams ?? "0"}mg
                    </strong>
                  </div>
                </div>
              </fieldset>

              <div className="modal-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-secondary" onClick={() => setSelectedItem(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CART BADGE */}
      {cart.length > 0 && (
        <button 
          className="floating-cart-btn"
          onClick={() => setIsCartModalOpen(true)}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            background: "#008080",
            color: "white",
            border: "none",
            borderRadius: "50px",
            padding: "16px 24px",
            boxShadow: "0 10px 25px rgba(0, 128, 128, 0.4)",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "transform 0.2s, background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
        >
          <span>🛒</span>
          <span>View Cart</span>
          <span style={{
            background: "#8B0000",
            color: "white",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            fontSize: "12px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold"
          }}>
            {cart.reduce((sum, ci) => sum + ci.quantity, 0)}
          </span>
        </button>
      )}

      {/* 1. CART MODAL */}
      {isCartModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCartModalOpen(false)}>
          <div className="modal-content info-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>🛒 Pre-Order Cart</h3>
              <button className="close-btn" onClick={() => setIsCartModalOpen(false)}>&times;</button>
            </div>
            
            <div className="modal-body">
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", color: "#666", padding: "40px 10px" }}>
                  <span style={{ fontSize: "3rem", display: "block", marginBottom: "12px" }}>🥪</span>
                  Your cart is empty. Add items from the menu to start pre-ordering!
                </div>
              ) : (
                <>
                  <div style={{ maxHeight: "250px", overflowY: "auto", marginBottom: "20px" }}>
                    {cart.map((ci) => (
                      <div key={ci.menuItem._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: "10px" }}>
                          <strong style={{ display: "block", fontSize: "14px", color: "#333" }}>{ci.menuItem.name}</strong>
                          <span style={{ fontSize: "12.5px", color: "#008080", fontWeight: 600 }}>
                            Rs. {ci.menuItem.price * ci.quantity}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button 
                            type="button" 
                            onClick={() => updateCartQty(ci.menuItem._id, ci.quantity - 1)}
                            style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #ddd", background: "#fcfcfc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: "15px", fontWeight: "bold", minWidth: "18px", textAlign: "center" }}>
                            {ci.quantity}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => updateCartQty(ci.menuItem._id, ci.quantity + 1)}
                            style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #ddd", background: "#fcfcfc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: "2px solid #eee", paddingTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <span style={{ color: "#555", fontWeight: 600 }}>Total Amount:</span>
                      <strong style={{ fontSize: "20px", color: "#8B0000" }}>Rs. {cartTotal}</strong>
                    </div>

                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "6px" }}>
                        Payment Method
                      </label>
                      <select 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value as "Cash" | "GCash")}
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", outline: "none", fontSize: "14px" }}
                      >
                        <option value="Cash">💵 Cash on Pickup</option>
                        <option value="GCash">📱 GCash Pre-payment</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "6px" }}>
                        Pickup Time
                      </label>
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        required
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn-place-order"
                      disabled={isPlacingOrder || !pickupTime}
                      onClick={handleProceedCheckout}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: !pickupTime ? "#ccc" : "#008080",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: !pickupTime ? "not-allowed" : "pointer",
                        fontWeight: "bold",
                        fontSize: "15px",
                        transition: "background 0.2s"
                      }}
                    >
                      {paymentMethod === "GCash" ? "Proceed to GCash Checkout" : "Confirm Pre-Order"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. CHECKOUT MODAL */}
      {isCheckoutModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutModalOpen(false)}>
          <div className="modal-content info-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>📱 GCash Payment Confirmation</h3>
              <button className="close-btn" onClick={() => setIsCheckoutModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmitCheckout}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <span style={{ fontSize: "3rem", display: "block" }}>📱</span>
                <p style={{ fontSize: "14.5px", color: "#555", margin: "10px 0 0 0" }}>
                  Please enter your 11-digit GCash mobile number to confirm pre-payment reference for <strong>{stallName}</strong>.
                </p>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#008080", marginTop: "12px" }}>
                  Amount to Pay: Rs. {cartTotal}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "6px" }}>
                  GCash Number *
                </label>
                <input
                  type="text"
                  pattern="[0-9]{11}"
                  maxLength={11}
                  required
                  placeholder="e.g. 09171234567"
                  value={gcashNumber}
                  onChange={(e) => setGcashNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", outline: "none", fontSize: "15px", boxSizing: "border-box", textAlign: "center", letterSpacing: "1px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setIsCheckoutModalOpen(false); setIsCartModalOpen(true); }}
                  style={{ flex: 1, padding: "10px" }}
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isPlacingOrder || gcashNumber.length !== 11}
                  style={{ flex: 1, padding: "10px", background: gcashNumber.length !== 11 ? "#ccc" : "#008080" }}
                >
                  {isPlacingOrder ? "Placing Order..." : "Confirm & Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. RECEIPT MODAL */}
      {placedOrderDetails && (
        <div className="modal-overlay" onClick={() => setPlacedOrderDetails(null)}>
          <div className="modal-content info-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="modal-header" style={{ borderBottom: "none" }}>
              <div style={{ width: "100%", textAlign: "center" }}>
                <span style={{ fontSize: "3rem", display: "block" }}>🎉</span>
                <h3 style={{ margin: "10px 0 0 0", color: "#2e7d32" }}>Order Placed Successfully!</h3>
              </div>
              <button className="close-btn" onClick={() => setPlacedOrderDetails(null)} style={{ position: "absolute", top: "15px", right: "15px" }}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="receipt-box" style={{ background: "#fafafa", border: "1px dashed #ccc", borderRadius: "8px", padding: "20px", fontFamily: "monospace" }}>
              <h4 style={{ textAlign: "center", margin: "0 0 16px 0", letterSpacing: "1px", textTransform: "uppercase" }}>Pre-Order Receipt</h4>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                <span>Order ID:</span>
                <strong>{placedOrderDetails._id.substring(placedOrderDetails._id.length - 8)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                <span>Date:</span>
                <strong>{new Date(placedOrderDetails.createdAt).toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "12px", borderBottom: "1px dashed #ccc", paddingBottom: "8px" }}>
                <span>Stall:</span>
                <strong>{stallName}</strong>
              </div>

              <div style={{ marginBottom: "16px", borderBottom: "1px dashed #ccc", paddingBottom: "12px" }}>
                <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "6px" }}>Items:</div>
                {placedOrderDetails.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}>
                    <span>{item.name} x{item.quantity}</span>
                    <span>Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", fontWeight: "bold" }}>
                <span>Total Paid/Due:</span>
                <strong>Rs. {placedOrderDetails.totalAmount}</strong>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                <span>Pickup Time:</span>
                <strong>{placedOrderDetails.pickupTime}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                <span>Payment Mode:</span>
                <strong>{placedOrderDetails.paymentMethod}</strong>
              </div>
              {placedOrderDetails.gcashNumber && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span>GCash Number:</span>
                  <strong>{placedOrderDetails.gcashNumber}</strong>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: "16px", color: "#666", fontSize: "13px" }}>
              Please show this receipt at the stall during pickup!
            </div>

            <div className="modal-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
              <button className="btn-secondary" onClick={() => setPlacedOrderDetails(null)} style={{ padding: "8px 24px" }}>Close</button>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}