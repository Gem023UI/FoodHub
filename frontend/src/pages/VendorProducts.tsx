import { useState, useEffect } from "react";
import { VendorHeader } from "../components/VendorHeader";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import "../styles/VendorProducts.css";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  photos: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  ingredients: string[];
  allergens: string[];
  nutrition: {
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatGrams: number | null;
    sodiumMilligrams: number | null;
  };
  favoriteCount: number;
  averageRating: number;
  reviewCount: number;
}

interface VendorProductsProps {
  token: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

const PRODUCT_CATEGORIES = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];

export function VendorProducts({ token, onNavigate, onLogout }: VendorProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [stall, setStall] = useState<any>(null);
  const [stallId, setStallId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    category: "Rice Meal",
    isAvailable: true,
    isFeatured: false,
    ingredients: [],
    allergens: [],
    nutrition: {
      calories: null,
      proteinGrams: null,
      carbsGrams: null,
      fatGrams: null,
      sodiumMilligrams: null
    },
    photos: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchVendorData();
  }, [token]);

  async function fetchVendorData() {
    setIsLoading(true);
    setError(null);

    try {
      // Get vendor info
      const vendorRes = await fetch("/api/users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!vendorRes.ok) {
        throw new Error("Failed to fetch vendor data");
      }

      const vendorData = await vendorRes.json();
      
      if (vendorData.stallId) {
        setStallId(vendorData.stallId);
        setStall(vendorData.stallData || { name: "My Stall" });
        await fetchProducts(vendorData.stallId);
      } else {
        setError("You are not assigned to any stall yet.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProducts(stallId: string) {
    try {
      const response = await fetch(`/api/stalls/${stallId}/products`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    }
  }

  // ─── IMAGE UPLOAD ──────────────────────────────────────────────────────
  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("product", file);

    const response = await fetch("/api/uploads/product", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  const groupedProducts = () => {
    const groups: Record<string, Product[]> = {};
    PRODUCT_CATEGORIES.forEach(cat => {
      groups[cat] = products.filter(p => p.category === cat);
    });
    const otherProducts = products.filter(p => !PRODUCT_CATEGORIES.includes(p.category || ""));
    if (otherProducts.length > 0) {
      groups["Other"] = otherProducts;
    }
    return groups;
  };

  // ─── ADD PRODUCT ──────────────────────────────────────────────────────
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!stallId) {
        setError("No stall assigned");
        setIsSubmitting(false);
        return;
      }

      let imageUrl = "";
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const productData = {
        ...formData,
        photos: imageUrl ? [imageUrl] : []
      };

      const response = await fetch(`/api/stalls/${stallId}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to add product");
      }

      const data = await response.json();
      setProducts(prev => [...prev, data.product]);
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

  // ─── UPDATE PRODUCT ──────────────────────────────────────────────────
  async function handleUpdateProduct(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!selectedProduct) return;

      let imageUrl = "";
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const updateData = {
        ...formData,
        photos: imageUrl ? [imageUrl] : formData.photos
      };

      const response = await fetch(`/api/stalls/products/${selectedProduct._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update product");
      }

      const data = await response.json();
      setProducts(prev => prev.map(p => 
        p._id === selectedProduct._id ? data.product : p
      ));
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

  // ─── DELETE PRODUCT ──────────────────────────────────────────────────
  async function handleDeleteProduct() {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!selectedProduct) return;

      const response = await fetch(`/api/stalls/products/${selectedProduct._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete product");
      }

      setProducts(prev => prev.filter(p => p._id !== selectedProduct._id));
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
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "Rice Meal",
      isAvailable: true,
      isFeatured: false,
      ingredients: [],
      allergens: [],
      nutrition: {
        calories: null,
        proteinGrams: null,
        carbsGrams: null,
        fatGrams: null,
        sodiumMilligrams: null
      },
      photos: []
    });
    setSelectedProduct(null);
    setSelectedImage(null);
    setImagePreview(null);
  }

  function openEditModal(product: Product) {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category || "Rice Meal",
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      ingredients: product.ingredients || [],
      allergens: product.allergens || [],
      nutrition: product.nutrition || {
        calories: null,
        proteinGrams: null,
        carbsGrams: null,
        fatGrams: null,
        sodiumMilligrams: null
      },
      photos: product.photos || []
    });
    setImagePreview(product.photos?.[0] || null);
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
        <VendorHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />
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
        <VendorHeader onNavigate={onNavigate} token={token} onLogout={onLogout} />
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

  const productGroups = groupedProducts();
  const totalProducts = products.length;

  return (
    <div className="vendor-products-page">
      <VendorHeader 
        onNavigate={onNavigate} 
        token={token} 
        stallName={stall?.name}
        onLogout={onLogout}
      />

      <div className="vendor-products-container">
        <div className="vendor-products-header">
          <div className="header-left">
            <h1>Manage Products</h1>
            <p className="subtitle">{stall?.name} • {totalProducts} products</p>
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
            {Object.entries(productGroups).map(([category, items]) => (
              <div key={category} className="product-category-section">
                <div className="category-header">
                  <h2>{category}</h2>
                  <span className="category-count">{items.length} items</span>
                </div>
                <div className="products-table-wrapper">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Featured</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <div className="product-image-cell">
                              <img 
                                src={product.photos?.[0] || "https://via.placeholder.com/50x50?text=No+Image"} 
                                alt={product.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/50x50?text=No+Image";
                                }}
                              />
                            </div>
                          </td>
                          <td className="product-name-cell">
                            <div className="product-name">{product.name}</div>
                            <div className="product-description">{product.description?.slice(0, 50) || ""}</div>
                          </td>
                          <td className="product-price-cell">₱{product.price.toFixed(2)}</td>
                          <td>
                            <span className={`status-badge ${product.isAvailable ? 'available' : 'unavailable'}`}>
                              {product.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td>
                            {product.isFeatured ? (
                              <span className="featured-badge">⭐ Featured</span>
                            ) : (
                              <span className="not-featured-badge">—</span>
                            )}
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
              </div>
            ))}
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
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category || "Rice Meal"}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable !== false}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    />
                    Available
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured || false}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                    Featured
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your product..."
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ingredients (comma separated)</label>
                  <input
                    type="text"
                    value={(formData.ingredients || []).join(", ")}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      ingredients: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                    })}
                    placeholder="e.g., Chicken, Rice, Spices"
                  />
                </div>
                <div className="form-group">
                  <label>Allergens (comma separated)</label>
                  <input
                    type="text"
                    value={(formData.allergens || []).join(", ")}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      allergens: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                    })}
                    placeholder="e.g., Soy, Gluten"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Product Image</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="image-upload-input"
                    id="add-image-upload"
                  />
                  <label htmlFor="add-image-upload" className="image-upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Choose Image</span>
                  </label>
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button
                        type="button"
                        className="image-remove"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <p className="field-hint">Supported formats: JPG, PNG, WebP. Max size: 5MB</p>
              </div>

              <div className="form-section-title">Nutrition Facts</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Calories</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.nutrition?.calories || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      nutrition: { 
                        ...formData.nutrition, 
                        calories: e.target.value ? parseFloat(e.target.value) : null 
                      } 
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
                    value={formData.nutrition?.proteinGrams || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      nutrition: { 
                        ...formData.nutrition, 
                        proteinGrams: e.target.value ? parseFloat(e.target.value) : null 
                      } 
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
                    value={formData.nutrition?.carbsGrams || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      nutrition: { 
                        ...formData.nutrition, 
                        carbsGrams: e.target.value ? parseFloat(e.target.value) : null 
                      } 
                    })}
                    placeholder="e.g., 45"
                  />
                </div>
                <div className="form-group">
                  <label>Fat (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nutrition?.fatGrams || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      nutrition: { 
                        ...formData.nutrition, 
                        fatGrams: e.target.value ? parseFloat(e.target.value) : null 
                      } 
                    })}
                    placeholder="e.g., 18"
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
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category || "Rice Meal"}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable !== false}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    />
                    Available
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured || false}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                    Featured
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ingredients (comma separated)</label>
                  <input
                    type="text"
                    value={(formData.ingredients || []).join(", ")}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      ingredients: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Allergens (comma separated)</label>
                  <input
                    type="text"
                    value={(formData.allergens || []).join(", ")}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      allergens: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                    })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Product Image</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="image-upload-input"
                    id="edit-image-upload"
                  />
                  <label htmlFor="edit-image-upload" className="image-upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Change Image</span>
                  </label>
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button
                        type="button"
                        className="image-remove"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <p className="field-hint">Current image will be replaced when you upload a new one.</p>
              </div>

              <div className="form-section-title">Nutrition Facts</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Calories</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.nutrition?.calories || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      nutrition: { 
                        ...formData.nutrition, 
                        calories: e.target.value ? parseFloat(e.target.value) : null 
                      } 
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nutrition?.proteinGrams || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      nutrition: { 
                        ...formData.nutrition, 
                        proteinGrams: e.target.value ? parseFloat(e.target.value) : null 
                      } 
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nutrition?.carbsGrams || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      nutrition: { 
                        ...formData.nutrition, 
                        carbsGrams: e.target.value ? parseFloat(e.target.value) : null 
                      } 
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Fat (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.nutrition?.fatGrams || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      nutrition: { 
                        ...formData.nutrition, 
                        fatGrams: e.target.value ? parseFloat(e.target.value) : null 
                      } 
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
              <p>Are you sure you want to delete <strong>"{selectedProduct.name}"</strong>?</p>
              <p className="delete-warning">This action cannot be undone.</p>
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