import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getVendorStall } from "../services/stall.service";
import {
  getProductsByStall,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  type Product,
  type ProductCategory,
} from "../services/product.service";
import "../styles/VendorProducts.css";

interface VendorProductsProps {
  token: string;
  onNavigate: (page: string, data?: any) => void;
  onLogout?: () => void;
}

const PRODUCT_CATEGORIES: ProductCategory[] = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];

interface ProductFormState {
  productName: string;
  productDescription: string;
  price: number;
  category: ProductCategory;
  stocks: number;
  available: boolean;
  nutrition: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    allergen: string;
  };
  productImages: string[];
}

const EMPTY_FORM: ProductFormState = {
  productName: "",
  productDescription: "",
  price: 0,
  category: "Rice Meal",
  stocks: 0,
  available: true,
  nutrition: { calories: null, protein: null, carbs: null, allergen: "" },
  productImages: [],
};

export function VendorProducts({ token, onNavigate }: VendorProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [stall, setStall] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Category filter ──────────────────────────────────────────────────
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // ── Modal states ──────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ── Form state ────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<ProductFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Image select/remove ───────────────────────────────────────────────
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const oversized = files.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      setError("Each image should be less than 5MB.");
      return;
    }

    const combined = [...selectedImages, ...files].slice(0, 5);
    setSelectedImages(combined);

    const previews: string[] = [];
    combined.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === combined.length) setImagePreviews([...previews]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Filtering ─────────────────────────────────────────────────────────
  const filteredProducts =
    categoryFilter === "All" ? products : products.filter((p) => p.category === categoryFilter);

  // ── Add product ───────────────────────────────────────────────────────
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!stall?._id) {
        setError("No stall assigned");
        setIsSubmitting(false);
        return;
      }

      let productImages: string[] = [];
      if (selectedImages.length > 0) {
        productImages = await uploadProductImages(token, selectedImages);
      }

      const { product } = await createProduct(token, stall._id, {
        ...formData,
        productImages,
      });

      setProducts((prev) => [...prev, product]);
      setShowAddModal(false);
      resetForm();
      setSuccessMsg("Product added successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Update product ────────────────────────────────────────────────────
  async function handleUpdateProduct(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!selectedProduct) return;

      let productImages = formData.productImages;
      if (selectedImages.length > 0) {
        productImages = await uploadProductImages(token, selectedImages);
      }

      const { product } = await updateProduct(token, selectedProduct._id, {
        ...formData,
        productImages,
      });

      setProducts((prev) => prev.map((p) => (p._id === selectedProduct._id ? product : p)));
      setShowEditModal(false);
      resetForm();
      setSuccessMsg("Product updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Delete product ────────────────────────────────────────────────────
  async function handleDeleteProduct() {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!selectedProduct) return;

      await deleteProduct(token, selectedProduct._id);

      setProducts((prev) => prev.filter((p) => p._id !== selectedProduct._id));
      setShowDeleteModal(false);
      setSelectedProduct(null);
      setSuccessMsg("Product deleted successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setFormData(EMPTY_FORM);
    setSelectedProduct(null);
    setSelectedImages([]);
    setImagePreviews([]);
  }

  function openEditModal(product: Product) {
    setSelectedProduct(product);
    setFormData({
      productName: product.productName,
      productDescription: product.productDescription || "",
      price: product.price,
      category: (product.category as ProductCategory) || "Rice Meal",
      stocks: product.stocks ?? 0,
      available: product.available,
      nutrition: {
        calories: product.nutrition?.calories ?? null,
        protein: product.nutrition?.protein ?? null,
        carbs: product.nutrition?.carbs ?? null,
        allergen: product.nutrition?.allergen ?? "",
      },
      productImages: product.productImages || [],
    });
    setSelectedImages([]);
    setImagePreviews(product.productImages || []);
    setShowEditModal(true);
  }

  function openDeleteModal(product: Product) {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  }

  function openAddModal() {
    resetForm();
    setShowAddModal(true);
  }

  if (isLoading) {
    return (
      <div className="vendor-products-page">
        <div className="vendor-products-loading">
          <Loader />
        </div>
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

  const totalProducts = products.length;

  return (
    <div className="vendor-products-page">
      <div className="vendor-products-container">
        <div className="vendor-products-header">
          <div className="header-left">
            <h1>Manage Products</h1>
            <p className="subtitle">{stall?.stallName} • {totalProducts} products</p>
          </div>
          <button className="add-product-btn" onClick={openAddModal}>
            <i className="fas fa-plus"></i> Add Product
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {totalProducts === 0 ? (
          <div className="empty-products">
            <div className="empty-icon">🍽️</div>
            <h3>No Products Yet</h3>
            <p>Start adding your menu items to showcase them to customers.</p>
            <button className="btn-primary" onClick={openAddModal}>
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="products-sections">
            <div className="category-filter-bar">
              <label htmlFor="category-filter-select">Filter by Category:</label>
              <select
                id="category-filter-select"
                className="category-filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories ({products.length})</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({products.filter((p) => p.category === cat).length})
                  </option>
                ))}
              </select>
            </div>

            {filteredProducts.length === 0 ? (
              <p className="no-reviews">No products in this category.</p>
            ) : (
              <div className="products-table-wrapper">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stocks</th>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <div className="product-image-cell">
                            <img
                              src={product.productImages?.[0] || "https://via.placeholder.com/50x50?text=No+Image"}
                              alt={product.productName}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/50x50?text=No+Image";
                              }}
                            />
                          </div>
                        </td>
                        <td className="product-name-cell">
                          <div className="product-name">{product.productName}</div>
                          <div className="product-description">
                            {product.productDescription?.slice(0, 50) || ""}
                          </div>
                        </td>
                        <td>{product.category}</td>
                        <td className="product-price-cell">₱{product.price.toFixed(2)}</td>
                        <td>{product.stocks ?? 0}</td>
                        <td>
                          <span className={`status-badge ${product.available ? "available" : "unavailable"}`}>
                            {product.available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td>
                          {product.reviewCount > 0
                            ? `⭐ ${product.averageRating.toFixed(1)} (${product.reviewCount})`
                            : "No reviews"}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit"
                              onClick={() => openEditModal(product)}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => openDeleteModal(product)}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── ADD PRODUCT MODAL ────────────────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Product</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddProduct} className="product-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    required
                    placeholder="e.g., Chicken Inasal"
                  />
                </div>
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stocks</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stocks}
                    onChange={(e) => setFormData({ ...formData, stocks: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    />
                    Available
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.productDescription}
                  onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                  placeholder="Describe your product..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Product Photos (max 5)</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="image-upload-input"
                    id="add-image-upload"
                    disabled={selectedImages.length >= 5}
                  />
                  <label htmlFor="add-image-upload" className="image-upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>{selectedImages.length >= 5 ? "Max 5 photos reached" : "Choose Photos"}</span>
                  </label>
                  {imagePreviews.length > 0 && (
                    <div className="photo-preview-grid">
                      {imagePreviews.map((src, index) => (
                        <div key={index} className="image-preview">
                          <img src={src} alt={`Preview ${index + 1}`} />
                          <button type="button" className="image-remove" onClick={() => removeImage(index)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="field-hint">Supported formats: JPG, PNG, WebP. Max size: 5MB each.</p>
              </div>

              <div className="form-section-title">Nutrition Facts</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Calories</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.nutrition.calories ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, calories: e.target.value ? parseFloat(e.target.value) : null }
                    })}
                    placeholder="e.g., 450"
                  />
                </div>
                <div className="form-group">
                  <label>Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nutrition.protein ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, protein: e.target.value ? parseFloat(e.target.value) : null }
                    })}
                    placeholder="e.g., 35"
                  />
                </div>
                <div className="form-group">
                  <label>Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nutrition.carbs ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, carbs: e.target.value ? parseFloat(e.target.value) : null }
                    })}
                    placeholder="e.g., 45"
                  />
                </div>
                <div className="form-group">
                  <label>Allergen</label>
                  <input
                    type="text"
                    value={formData.nutrition.allergen}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, allergen: e.target.value }
                    })}
                    placeholder="e.g., Soy, Gluten"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT PRODUCT MODAL ───────────────────────────────────────── */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateProduct} className="product-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stocks</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stocks}
                    onChange={(e) => setFormData({ ...formData, stocks: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    />
                    Available
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.productDescription}
                  onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Product Photos (max 5)</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="image-upload-input"
                    id="edit-image-upload"
                    disabled={selectedImages.length >= 5}
                  />
                  <label htmlFor="edit-image-upload" className="image-upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Add / Replace Photos</span>
                  </label>
                  {imagePreviews.length > 0 && (
                    <div className="photo-preview-grid">
                      {imagePreviews.map((src, index) => (
                        <div key={index} className="image-preview">
                          <img src={src} alt={`Preview ${index + 1}`} />
                          <button type="button" className="image-remove" onClick={() => removeImage(index)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="field-hint">Uploading new photos replaces the current set when you save.</p>
              </div>

              <div className="form-section-title">Nutrition Facts</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Calories</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.nutrition.calories ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, calories: e.target.value ? parseFloat(e.target.value) : null }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nutrition.protein ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, protein: e.target.value ? parseFloat(e.target.value) : null }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nutrition.carbs ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, carbs: e.target.value ? parseFloat(e.target.value) : null }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Allergen</label>
                  <input
                    type="text"
                    value={formData.nutrition.allergen}
                    onChange={(e) => setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, allergen: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ────────────────────────────────── */}
      {showDeleteModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Product</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="delete-confirmation">
              <div className="delete-icon">⚠️</div>
              <p>Are you sure you want to delete <strong>"{selectedProduct.productName}"</strong>?</p>
              <p className="delete-warning">This also removes its reviews. This action cannot be undone.</p>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-danger" onClick={handleDeleteProduct} disabled={isSubmitting}>
                  {isSubmitting ? "Deleting..." : "Delete Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
}