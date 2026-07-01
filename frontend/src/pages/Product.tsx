import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { getProductById, getReviewsByProduct, toggleFavorite } from "../lib/api";
import "../styles/Product.css";

interface ProductData {
  _id: string;
  name: string;
  description: string;
  price: number;
  photos: string[];
  category: string;
  isAvailable: boolean;
  ingredients: string[];
  allergens: string[];
  nutrition: {
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatGrams: number | null;
    sodiumMilligrams: number | null;
  };
  stallId: {
    _id: string;
    name: string;
    location: string;
    photos: string[];
  } | string;
  favoriteCount: number;
  averageRating: number;
  reviewCount: number;
}

interface ReviewData {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
    course: string;
  };
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
}

interface ProductProps {
  token?: string;
  productId: string;
  onNavigate: (page: string, data?: any) => void;
  onLogout?: () => void;
}

export function Product({ token, productId, onNavigate, onLogout }: ProductProps) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId, token]);

  async function loadProduct() {
    setIsLoading(true);
    setError(null);
    try {
      const productData = await getProductById(productId);
      setProduct(productData);

      // Load reviews
      const reviewsData = await getReviewsByProduct(productId);
      setReviews(reviewsData);

      // Check if favorited (only if logged in)
      if (token) {
        try {
          const favResponse = await fetch(`/api/favorites/check/${productId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (favResponse.ok) {
            const data = await favResponse.json();
            setIsFavorited(data.isFavorited);
          }
        } catch (err) {
          console.error("Error checking favorite:", err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleFavorite() {
    if (!token) {
      onNavigate("login");
      return;
    }

    try {
      const result = await toggleFavorite(token, productId);
      setIsFavorited(result.isFavorited);
      // Update favorite count
      setProduct(prev => prev ? {
        ...prev,
        favoriteCount: result.isFavorited ? prev.favoriteCount + 1 : prev.favoriteCount - 1
      } : null);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  }

  function handleAddToCart() {
    if (!token) {
      onNavigate("login");
      return;
    }

    if (!product) return;

    // Get existing cart
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    
    // Check if item already exists
    const existingIndex = existingCart.findIndex(
      (item: any) => item.productId === product._id
    );

    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += quantity;
    } else {
      existingCart.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        photos: product.photos,
        nutrition: product.nutrition,
        stallId: typeof product.stallId === "object" ? product.stallId._id : product.stallId,
        stallName: typeof product.stallId === "object" ? product.stallId.name : "",
        isChecked: true
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    
    // Show success feedback
    const addBtn = document.querySelector('.add-to-cart-btn');
    if (addBtn) {
      addBtn.textContent = '✅ Added!';
      setTimeout(() => {
        addBtn.textContent = 'Add to Cart';
      }, 2000);
    }
  }

  function handleOrderNow() {
    if (!token) {
      onNavigate("login");
      return;
    }

    if (!product) return;

    // Add to cart first
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingIndex = existingCart.findIndex(
      (item: any) => item.productId === product._id
    );

    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += quantity;
    } else {
      existingCart.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        photos: product.photos,
        nutrition: product.nutrition,
        stallId: typeof product.stallId === "object" ? product.stallId._id : product.stallId,
        stallName: typeof product.stallId === "object" ? product.stallId.name : "",
        isChecked: true
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));

    // Navigate to preorder with this item
    onNavigate("preorder", {
      items: [{
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        photos: product.photos,
        nutrition: product.nutrition
      }],
      stallId: typeof product.stallId === "object" ? product.stallId._id : product.stallId,
      stallName: typeof product.stallId === "object" ? product.stallId.name : "",
      totalAmount: product.price * quantity
    });
  }

  if (isLoading) {
    return (
      <div className="product-page">
        <Header onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="home" />
        <div className="product-loading">
          <Loader />
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-page">
        <Header onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="home" />
        <div className="product-error">
          <h2>Product Not Found</h2>
          <p>{error || "The product you're looking for doesn't exist."}</p>
          <button className="btn-primary" onClick={() => onNavigate("stalls")}>
            Browse Stalls
          </button>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const stallName = typeof product.stallId === "object" ? product.stallId.name : "";
  const stallId = typeof product.stallId === "object" ? product.stallId._id : product.stallId;

  return (
    <div className="product-page">
      <Header onNavigate={onNavigate} token={token} onLogout={onLogout} currentPage="home" />

      <div className="product-container">
        <button className="btn-back" onClick={() => onNavigate("stalls")}>
          ← Back to Stalls
        </button>

        <div className="product-content">
          {/* Image Gallery */}
          <div className="product-gallery">
            <div className="main-image">
              <img
                src={product.photos?.[activeImage] || "https://via.placeholder.com/400x400?text=No+Image"}
                alt={product.name}
              />
              {!product.isAvailable && (
                <span className="unavailable-badge">Unavailable</span>
              )}
            </div>
            {product.photos && product.photos.length > 1 && (
              <div className="thumbnail-list">
                {product.photos.map((photo, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${index === activeImage ? "active" : ""}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={photo} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <h1>{product.name}</h1>
              <div className="product-actions-header">
                <button
                  className={`favorite-btn ${isFavorited ? "favorited" : ""}`}
                  onClick={handleToggleFavorite}
                  title={token ? "Add to favorites" : "Login to favorite"}
                >
                  <i className={`fas ${isFavorited ? "fa-heart" : "fa-heart"}`}></i>
                  <span>{product.favoriteCount || 0}</span>
                </button>
              </div>
            </div>

            <div className="product-meta">
              <span className="product-price">₱{product.price.toFixed(2)}</span>
              <span className="product-stall" onClick={() => onNavigate(`stall/${stallId}`)}>
                <i className="fas fa-store"></i> {stallName}
              </span>
              {product.averageRating > 0 && (
                <span className="product-rating">
                  ⭐ {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              )}
            </div>

            <div className="product-category">
              <span className="category-tag">{product.category || "General"}</span>
              <span className={`availability ${product.isAvailable ? "available" : "unavailable"}`}>
                {product.isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description || "No description available."}</p>
            </div>

            {product.ingredients && product.ingredients.length > 0 && (
              <div className="product-ingredients">
                <h3>Ingredients</h3>
                <ul>
                  {product.ingredients.map((ing, index) => (
                    <li key={index}>{ing}</li>
                  ))}
                </ul>
              </div>
            )}

            {product.allergens && product.allergens.length > 0 && (
              <div className="product-allergens">
                <h3>⚠️ Allergens</h3>
                <ul>
                  {product.allergens.map((allergen, index) => (
                    <li key={index}>{allergen}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="product-nutrition">
              <h3>Nutrition Facts</h3>
              <div className="nutrition-grid">
                {product.nutrition.calories && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Calories</span>
                    <span className="nutrition-value">{product.nutrition.calories}</span>
                  </div>
                )}
                {product.nutrition.proteinGrams && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Protein</span>
                    <span className="nutrition-value">{product.nutrition.proteinGrams}g</span>
                  </div>
                )}
                {product.nutrition.carbsGrams && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Carbs</span>
                    <span className="nutrition-value">{product.nutrition.carbsGrams}g</span>
                  </div>
                )}
                {product.nutrition.fatGrams && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Fat</span>
                    <span className="nutrition-value">{product.nutrition.fatGrams}g</span>
                  </div>
                )}
                {product.nutrition.sodiumMilligrams && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Sodium</span>
                    <span className="nutrition-value">{product.nutrition.sodiumMilligrams}mg</span>
                  </div>
                )}
              </div>
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <label>Quantity</label>
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!product.isAvailable}
                  >
                    -
                  </button>
                  <span className="qty-value">{quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!product.isAvailable}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={!product.isAvailable}
                >
                  <i className="fas fa-cart-plus"></i> Add to Cart
                </button>
                <button
                  className="order-now-btn"
                  onClick={handleOrderNow}
                  disabled={!product.isAvailable}
                >
                  <i className="fas fa-bolt"></i> Order Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h2>Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.studentId.profilePictureUrl ? (
                          <img src={review.studentId.profilePictureUrl} alt="" />
                        ) : (
                          <span>{review.studentId.firstName[0]}{review.studentId.lastName[0]}</span>
                        )}
                      </div>
                      <div className="reviewer-name">
                        <span>{review.studentId.firstName} {review.studentId.lastName}</span>
                        <span className="reviewer-course">{review.studentId.course}</span>
                      </div>
                    </div>
                    <div className="review-rating">
                      {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  <div className="review-comment">{review.comment}</div>
                  {review.photos && review.photos.length > 0 && (
                    <div className="review-photos">
                      {review.photos.map((photo, index) => (
                        <img key={index} src={photo} alt={`Review ${index + 1}`} />
                      ))}
                    </div>
                  )}
                  <div className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}