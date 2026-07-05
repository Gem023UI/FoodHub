import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { ProductCard } from "../components/ProductCard";
import { VendorOrderCard } from "../components/VendorOrderCard";
import { getVendorStall, setStallStatus, addVendorAccount } from "../services/stall.service";
import { getStallOrders, updateOrderStatus, updatePaymentStatus, Order } from "../services/order.service";
import { createProduct, uploadProductImages, ProductCategory } from "../services/product.service";
import tupLogo from "../../images/Logo.png";
import "../styles/VendorStall.css";

interface VendorStallPageProps {
  token: string;
  onNavigate: (page: string, data?: any) => void;
  onLogout?: () => void;
}

const PRODUCT_CATEGORIES: ProductCategory[] = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];
const VENDOR_POSITIONS = ["Cook", "Manager", "Financier"];

export function VendorStallPage({ token, onNavigate, onLogout }: VendorStallPageProps) {
  const [stall, setStall] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // ── Add Vendor modal ──
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
    position: "Cook" as "Cook" | "Manager" | "Financier",
  });

  // ── Add Product modal ──
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    productName: "",
    productDescription: "",
    price: 0,
    category: "Rice Meal" as ProductCategory,
    stocks: 0,
    available: true,
    nutrition: { calories: null as number | null, protein: null as number | null, carbs: null as number | null, allergen: "" },
  });
  const [productPhotos, setProductPhotos] = useState<File[]>([]);
  const [productPhotoPreviews, setProductPhotoPreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchVendorData();
  }, [token]);

  async function fetchVendorData() {
    setIsLoading(true);
    setError(null);
    try {
      const stallData = await getVendorStall(token);
      setStall(stallData);
      setProducts(stallData.products || []);

      try {
        const orderList = await getStallOrders(token, stallData._id);
        setOrders(orderList);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    } catch (err) {
      console.error("Error fetching vendor data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleStallStatus() {
    if (!stall || isTogglingStatus) return;
    setIsTogglingStatus(true);
    try {
      const result = await setStallStatus(token, stall._id, !stall.status);
      setStall(result.stall);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stall status");
    } finally {
      setIsTogglingStatus(false);
    }
  }

  async function handleAddVendor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (vendorForm.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmittingVendor(true);
    try {
      await addVendorAccount(token, stall._id, {
        firstName: vendorForm.firstName,
        lastName: vendorForm.lastName,
        email: vendorForm.email,
        password: vendorForm.password,
        contactNumber: vendorForm.contactNumber || undefined,
        position: vendorForm.position,
      });
      setSuccessMsg("Vendor added successfully.");
      setVendorForm({ firstName: "", lastName: "", email: "", password: "", contactNumber: "", position: "Cook" });
      setShowAddVendorModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vendor");
    } finally {
      setIsSubmittingVendor(false);
    }
  }

  function handleProductPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const combined = [...productPhotos, ...files].slice(0, 5);
    setProductPhotos(combined);

    const previews: string[] = [];
    combined.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push(reader.result as string);
        if (previews.length === combined.length) setProductPhotoPreviews([...previews]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeProductPhoto(index: number) {
    setProductPhotos((prev) => prev.filter((_, i) => i !== index));
    setProductPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function resetProductForm() {
    setProductForm({
      productName: "",
      productDescription: "",
      price: 0,
      category: "Rice Meal",
      stocks: 0,
      available: true,
      nutrition: { calories: null, protein: null, carbs: null, allergen: "" },
    });
    setProductPhotos([]);
    setProductPhotoPreviews([]);
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmittingProduct(true);

    try {
      let productImages: string[] = [];
      if (productPhotos.length > 0) {
        productImages = await uploadProductImages(token, productPhotos);
      }

      await createProduct(token, stall._id, {
        ...productForm,
        productImages,
      });

      setSuccessMsg("Product added successfully.");
      resetProductForm();
      setShowAddProductModal(false);

      await fetchVendorData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setIsSubmittingProduct(false);
    }
  }

  async function handleOrderStatusUpdate(orderId: string, status: Order["orderStatus"]) {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(token, orderId, status);
      const orderList = await getStallOrders(token, stall._id);
      setOrders(orderList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handlePaymentStatusUpdate(orderId: string, status: "pending" | "paid" | "refunded") {
    setUpdatingOrderId(orderId);
    try {
      await updatePaymentStatus(token, orderId, status);
      const orderList = await getStallOrders(token, stall._id);
      setOrders(orderList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment status");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function productsByCategory(category: string) {
    return products.filter((p) => p.category === category && p.available !== false);
  }

  if (isLoading) {
    return (
      <div className="stall-page">
        <div className="stall-page-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (error && !stall) {
    return (
      <div className="stall-page">
        <div className="stall-page-error">
          <h2>No Stall Assigned</h2>
          <p>{error}</p>
          <button className="stall-page-back-btn" onClick={() => onNavigate("vendor-profile")}>
            Contact Admin
          </button>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const readyPaidOrders = orders.filter(
    (o) => o.orderStatus === "ready" && o.paymentRecord?.status === "paid"
  );

  return (
    <div className="stall-page">
      {/* ─── HERO (identical to Stalls.tsx, plus vendor toolbar) ─── */}
      <section
        className="stall-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${stall.stallPicture || tupLogo})`,
        }}
      >
        <div className="vendor-hero-toolbar">
          <button className="hero-action-btn" onClick={() => setShowAddVendorModal(true)}>
            <i className="fas fa-user-plus"></i> Add Vendor
          </button>
          <button className="hero-action-btn" onClick={() => setShowAddProductModal(true)}>
            <i className="fas fa-plus"></i> Add Product
          </button>
          <label className="stall-status-toggle">
            <input
              type="checkbox"
              checked={!!stall.status}
              onChange={handleToggleStallStatus}
              disabled={isTogglingStatus}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">{stall.status ? "Open" : "Closed"}</span>
          </label>
        </div>

        <div className="stall-hero-content">
          <p className="stall-hero-welcome">Welcome to,</p>
          <h1 className="stall-hero-name">{stall.stallName}</h1>
          {stall.stallDescription && (
            <p className="stall-hero-desc">{stall.stallDescription}</p>
          )}
          <p className="stall-hero-section">Section {stall.section}</p>
          {stall.openHours && (
            <p className="stall-hero-hours">
              <i className="fas fa-clock"></i> {stall.openHours.openTime} - {stall.openHours.closingTime}
            </p>
          )}
          <div className="stall-hero-payments">
            <span className="stall-hero-payments-label">Payment Method Available:</span>
            <span className="stall-hero-payments-list">
              {[
                stall.paymentMethod?.cash?.available && "Cash",
                stall.paymentMethod?.gcash?.available && "GCash",
                stall.paymentMethod?.paymaya?.available && "Maya",
              ]
                .filter(Boolean)
                .join(", ") || "Not specified"}
            </span>
          </div>
        </div>
      </section>

      {(error || successMsg) && (
        <div className={`vendor-stall-alert ${error ? "alert-error" : "alert-success"}`}>
          {error || successMsg}
        </div>
      )}

      {/* ─── ORDER RECORDS (paid + ready) ─── */}
      <section className="stall-orders-section">
        <h2 className="stall-category-title">Orders Ready for Pickup ({readyPaidOrders.length})</h2>
        {readyPaidOrders.length === 0 ? (
          <p className="stall-orders-empty">No paid, ready-for-pickup orders right now.</p>
        ) : (
          <div className="vendor-order-cards">
            {readyPaidOrders.map((order) => (
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
      </section>

      {/* ─── PRODUCTS BY CATEGORY (identical to Stalls.tsx) ─── */}
      <section className="stall-products-section">
        {PRODUCT_CATEGORIES.map((category) => {
          const items = productsByCategory(category);
          if (items.length === 0) return null;
          return (
            <div className="stall-category-block" key={category}>
              <h2 className="stall-category-title">{category}</h2>
              <div className="stall-category-rail">
                {items.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    token={token}
                    onClick={() => onNavigate("product", product._id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="stall-no-products">
            <div className="stall-no-products-icon">🍽️</div>
            <h3>No products available yet</h3>
            <p>Use "Add Product" above to start building your menu.</p>
          </div>
        )}
      </section>

      {/* ── ADD VENDOR MODAL ── */}
      {showAddVendorModal && (
        <div className="modal-overlay" onClick={() => setShowAddVendorModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Vendor</h2>
              <button className="modal-close" onClick={() => setShowAddVendorModal(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleAddVendor}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>First name</label>
                    <input type="text" value={vendorForm.firstName} onChange={(e) => setVendorForm({ ...vendorForm, firstName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Last name</label>
                    <input type="text" value={vendorForm.lastName} onChange={(e) => setVendorForm({ ...vendorForm, lastName: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email address</label>
                  <input type="email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={vendorForm.password} onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })} required minLength={8} placeholder="Temporary password for the vendor" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact number</label>
                    <input type="tel" value={vendorForm.contactNumber} onChange={(e) => setVendorForm({ ...vendorForm, contactNumber: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Position</label>
                    <select value={vendorForm.position} onChange={(e) => setVendorForm({ ...vendorForm, position: e.target.value as typeof vendorForm.position })}>
                      {VENDOR_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddVendorModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmittingVendor}>
                  {isSubmittingVendor ? "Creating…" : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD PRODUCT MODAL ── */}
      {showAddProductModal && (
        <div className="modal-overlay" onClick={() => setShowAddProductModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Product</h2>
              <button className="modal-close" onClick={() => setShowAddProductModal(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleAddProduct}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input type="text" value={productForm.productName} onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Price *</label>
                    <input type="number" step="0.01" min="0" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value as ProductCategory })}>
                      {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Stocks</label>
                    <input type="number" min="0" value={productForm.stocks} onChange={(e) => setProductForm({ ...productForm, stocks: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={productForm.productDescription} onChange={(e) => setProductForm({ ...productForm, productDescription: e.target.value })} rows={2} />
                </div>

                <div className="form-section-title">Nutrition Facts</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Calories</label>
                    <input type="number" min="0" value={productForm.nutrition.calories ?? ""} onChange={(e) => setProductForm({ ...productForm, nutrition: { ...productForm.nutrition, calories: e.target.value ? parseFloat(e.target.value) : null } })} />
                  </div>
                  <div className="form-group">
                    <label>Protein (g)</label>
                    <input type="number" min="0" value={productForm.nutrition.protein ?? ""} onChange={(e) => setProductForm({ ...productForm, nutrition: { ...productForm.nutrition, protein: e.target.value ? parseFloat(e.target.value) : null } })} />
                  </div>
                  <div className="form-group">
                    <label>Carbs (g)</label>
                    <input type="number" min="0" value={productForm.nutrition.carbs ?? ""} onChange={(e) => setProductForm({ ...productForm, nutrition: { ...productForm.nutrition, carbs: e.target.value ? parseFloat(e.target.value) : null } })} />
                  </div>
                  <div className="form-group">
                    <label>Allergen</label>
                    <input type="text" value={productForm.nutrition.allergen} onChange={(e) => setProductForm({ ...productForm, nutrition: { ...productForm.nutrition, allergen: e.target.value } })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Photos (max 5)</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleProductPhotoSelect}
                      className="image-upload-input"
                      id="vendor-product-photos"
                      disabled={productPhotos.length >= 5}
                    />
                    <label htmlFor="vendor-product-photos" className="image-upload-label">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>{productPhotos.length >= 5 ? "Max 5 photos reached" : "Choose Photos"}</span>
                    </label>
                    {productPhotoPreviews.length > 0 && (
                      <div className="photo-preview-grid">
                        {productPhotoPreviews.map((src, index) => (
                          <div key={index} className="image-preview">
                            <img src={src} alt={`Preview ${index + 1}`} />
                            <button type="button" className="image-remove" onClick={() => removeProductPhoto(index)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="field-hint">{productPhotos.length}/5 photos selected.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddProductModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmittingProduct}>
                  {isSubmittingProduct ? "Adding…" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
}