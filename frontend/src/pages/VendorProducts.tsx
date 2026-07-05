import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { ProductCard } from "../components/ProductCard";
import { getVendorStall } from "../services/stall.service";
import { getProductsByStall, createProduct, uploadProductImages, ProductCategory } from "../services/product.service";
import { getReviewsByProduct } from "../services/review.service";
import "../styles/VendorProducts.css";

interface VendorProductsProps {
  token: string;
  onNavigate: (page: string, data?: any) => void;
  onLogout?: () => void;
}

const PRODUCT_CATEGORIES: ProductCategory[] = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];
const VENDOR_POSITIONS_UNUSED = null; // (kept for parity; not needed here)

interface FlatReview {
  _id: string;
  reviewEmail: string;
  reviewProfileUrl: string | null;
  rating: number;
  comment: string;
  reviewImages: string[];
  reviewDate: string;
  productId: string;
  productName: string;
}

export function VendorProducts({ token, onNavigate, onLogout }: VendorProductsProps) {
  const [stall, setStall] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [latestReviews, setLatestReviews] = useState<FlatReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Add Product modal (same functionality as VendorStall) ──
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

      const productList = await getProductsByStall(stallData._id);
      setProducts(productList);

      await loadLatestReviews(productList);
    } catch (err) {
      console.error("Error fetching vendor products data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLatestReviews(productList: any[]) {
    try {
      const allReviews: FlatReview[] = [];
      for (const product of productList) {
        try {
          const reviews = await getReviewsByProduct(product._id);
          reviews.forEach((r) => {
            allReviews.push({
              ...r,
              productId: product._id,
              productName: product.productName,
            });
          });
        } catch (err) {
          console.error(`Error loading reviews for product ${product._id}:`, err);
        }
      }
      allReviews.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());
      setLatestReviews(allReviews.slice(0, 5));
    } catch (err) {
      console.error("Error loading latest reviews:", err);
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

      const productList = await getProductsByStall(stall._id);
      setProducts(productList);
      await loadLatestReviews(productList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setIsSubmittingProduct(false);
    }
  }

  function productsByCategory(category: string) {
    return products.filter((p) => p.category === category);
  }

  if (isLoading) {
    return (
      <div className="vendor-products-page">
        <div className="vendor-products-loading"><Loader /></div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (error && !stall) {
    return (
      <div className="vendor-products-page">
        <div className="vendor-products-error">
          <div className="error-icon">⚠️</div>
          <h2>No Stall Assigned</h2>
          <p>{error}</p>
          <button onClick={() => onNavigate("vendor-profile")} className="contact-btn">
            Contact Admin
          </button>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="vendor-products-page">
      <div className="vendor-products-container">
        <div className="vendor-products-header">
          <div className="header-left">
            <h1>Orders</h1>
            <p className="subtitle">{stall?.stallName} • {products.length} products</p>
          </div>
          <button className="add-product-btn" onClick={() => setShowAddProductModal(true)}>
            <i className="fas fa-plus"></i> Add Product
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {products.length === 0 ? (
          <div className="empty-products">
            <div className="empty-icon">🍽️</div>
            <h3>No Products Yet</h3>
            <p>Start adding your menu items to showcase them to customers.</p>
            <button className="btn-primary" onClick={() => setShowAddProductModal(true)}>
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="products-sections">
            {PRODUCT_CATEGORIES.map((category) => {
              const items = productsByCategory(category);
              if (items.length === 0) return null;
              return (
                <div className="lp-category-block" key={category}>
                  <h3 className="lp-category-title">{category}</h3>
                  <div className="lp-category-rail">
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
          </div>
        )}

        {/* ── Latest 5 Reviews ── */}
        <div className="reviews-header" style={{ marginTop: "36px" }}>
          <h2>Latest Reviews</h2>
        </div>
        {latestReviews.length === 0 ? (
          <p className="no-reviews">No reviews yet.</p>
        ) : (
          <div className="reviews-list">
            {latestReviews.map((review) => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">
                      {review.reviewProfileUrl ? (
                        <img src={review.reviewProfileUrl} alt="" />
                      ) : (
                        <span>{review.reviewEmail?.[0]?.toUpperCase() || "U"}</span>
                      )}
                    </div>
                    <div className="reviewer-name">
                      <span>{review.reviewEmail}</span>
                      <div className="review-product-tag">on {review.productName}</div>
                    </div>
                  </div>
                  <div className="review-rating">
                    {"⭐".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </div>
                </div>
                {review.comment && <div className="review-comment">{review.comment}</div>}
                {review.reviewImages && review.reviewImages.length > 0 && (
                  <div className="review-photos">
                    {review.reviewImages.map((photo, index) => (
                      <img key={index} src={photo} alt={`Review ${index + 1}`} />
                    ))}
                  </div>
                )}
                <div className="review-date">
                  {new Date(review.reviewDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADD PRODUCT MODAL ── */}
      {showAddProductModal && (
        <div className="modal-overlay" onClick={() => setShowAddProductModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Product</h2>
              <button className="modal-close" onClick={() => setShowAddProductModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddProduct} className="product-form">
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
                    id="vp-product-photos"
                    disabled={productPhotos.length >= 5}
                  />
                  <label htmlFor="vp-product-photos" className="image-upload-label">
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

              <div className="form-actions">
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