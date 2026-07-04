import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import Loader from "../components/Loader";
import { toggleFavorite, checkFavorite, getFavorites } from "../services/favorite.service";
import { getProductDetails, type Product, type ProductReview } from "../services/product.service";
import { getReviewsByProduct, createReview } from "../services/review.service";
import "../styles/Product.css";

interface ProductProps {
  token?: string;
  productId: string;
  onNavigate: (page: string, data?: any) => void;
  onLogout?: () => void;
}

export function Product({ token, productId, onNavigate, onLogout }: ProductProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId, token]);

  async function loadProduct() {
    setIsLoading(true);
    setError(null);
    try {
      const productData = await getProductDetails(productId);
      setProduct(productData);

      // Load reviews
      const reviewsData = await getReviewsByProduct(productId);
      setReviews(reviewsData);

      // Check if favorited (only if logged in)
      if (token) {
        try {
          const favResult = await checkFavorite(token, productId);
          setIsFavorited(favResult.isFavorited);
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
      setProduct(prev => prev ? {
        ...prev,
        favorite: result.isFavorited ? (prev.favorite || 0) + 1 : (prev.favorite || 0) - 1
      } : null);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      onNavigate("login");
      return;
    }

    setIsSubmittingReview(true);
    setError(null);
    try {
      const result = await createReview(token, {
        productId,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviews(prev => [...prev, result.review]);
      setShowReviewModal(false);
      setReviewComment("");
      setReviewRating(5);
      setReviewSuccess("Review submitted successfully!");
      setTimeout(() => setReviewSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  function handleAddToCart() {
    if (!token) {
      onNavigate("login");
      return;
    }

    if (!product) return;

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingIndex = existingCart.findIndex(
      (item: any) => item.productId === product._id
    );

    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += quantity;
    } else {
      existingCart.push({
        productId: product._id,
        productName: product.productName,
        price: product.price,
        quantity: quantity,
        productImages: product.productImages,
        nutrition: product.nutrition,
        stallId: typeof product.stallId === "object" ? product.stallId._id : product.stallId,
        stallName: typeof product.stallId === "object" ? product.stallId.stallName : "",
        isChecked: true
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    
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

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingIndex = existingCart.findIndex(
      (item: any) => item.productId === product._id
    );

    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += quantity;
    } else {
      existingCart.push({
        productId: product._id,
        productName: product.productName,
        price: product.price,
        quantity: quantity,
        productImages: product.productImages,
        nutrition: product.nutrition,
        stallId: typeof product.stallId === "object" ? product.stallId._id : product.stallId,
        stallName: typeof product.stallId === "object" ? product.stallId.stallName : "",
        isChecked: true
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));

    onNavigate("preorder", {
      items: [{
        productId: product._id,
        productName: product.productName,
        price: product.price,
        quantity: quantity,
        productImages: product.productImages,
        nutrition: product.nutrition
      }],
      stallId: typeof product.stallId === "object" ? product.stallId._id : product.stallId,
      stallName: typeof product.stallId === "object" ? product.stallId.stallName : "",
      totalAmount: product.price * quantity
    });
  }

  if (isLoading) {
    return (
      <div className="product-page">
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

  const stallName = typeof product.stallId === "object" ? product.stallId.stallName : "";
  const stallId = typeof product.stallId === "object" ? product.stallId._id : product.stallId;

  return (
    <div className="product-page">
      <div className="product-container">
        <button className="btn-back" onClick={() => onNavigate("stalls")}>
          ← Back to Stalls
        </button>

        {reviewSuccess && <div className="alert alert-success">{reviewSuccess}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="product-content">
          {/* Image Gallery */}
          <div className="product-gallery">
            <div className="main-image">
              <img
                src={product.productImages?.[activeImage] || "https://via.placeholder.com/400x400?text=No+Image"}
                alt={product.productName}
              />
              {!product.available && (
                <span className="unavailable-badge">Unavailable</span>
              )}
            </div>
            {product.productImages && product.productImages.length > 1 && (
              <div className="thumbnail-list">
                {product.productImages.map((photo, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${index === activeImage ? "active" : ""}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={photo} alt={`${product.productName} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <h1>{product.productName}</h1>
              <div className="product-actions-header">
                <button
                  className={`favorite-btn ${isFavorited ? "favorited" : ""}`}
                  onClick={handleToggleFavorite}
                  title={token ? "Add to favorites" : "Login to favorite"}
                >
                  <i className={`fas ${isFavorited ? "fa-heart" : "fa-heart"}`}></i>
                  <span>{product.favorite || 0}</span>
                </button>
              </div>
            </div>

            <div className="product-meta">
              <span className="product-price">₱{product.price.toFixed(2)}</span>
              <span className="product-stall" onClick={() => onNavigate("stall", stallId)}>
                <i className="fas fa-store"></i> {stallName}
              </span>
              {product.averageRating > 0 && (
                <span className="product-rating">
                  ⭐ {product.averageRating.toFixed(1)} ({product.reviewCount || 0} reviews)
                </span>
              )}
            </div>

            <div className="product-category">
              <span className="category-tag">{product.category || "General"}</span>
              <span className={`availability ${product.available ? "available" : "unavailable"}`}>
                {product.available ? "Available" : "Unavailable"}
              </span>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.productDescription || "No description available."}</p>
            </div>

            <div className="product-nutrition">
              <h3>Nutrition Facts</h3>
              <div className="nutrition-grid">
                {product.nutrition?.calories && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Calories</span>
                    <span className="nutrition-value">{product.nutrition.calories}</span>
                  </div>
                )}
                {product.nutrition?.protein && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Protein</span>
                    <span className="nutrition-value">{product.nutrition.protein}g</span>
                  </div>
                )}
                {product.nutrition?.carbs && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Carbs</span>
                    <span className="nutrition-value">{product.nutrition.carbs}g</span>
                  </div>
                )}
                {product.nutrition?.allergen && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Allergen</span>
                    <span className="nutrition-value">{product.nutrition.allergen}</span>
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
                    disabled={!product.available}
                  >
                    -
                  </button>
                  <span className="qty-value">{quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!product.available}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={!product.available}
                >
                  <i className="fas fa-cart-plus"></i> Add to Cart
                </button>
                <button
                  className="order-now-btn"
                  onClick={handleOrderNow}
                  disabled={!product.available}
                >
                  <i className="fas fa-bolt"></i> Order Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h2>Reviews ({reviews.length})</h2>
            {token && (
              <button 
                className="btn-primary"
                onClick={() => setShowReviewModal(true)}
                disabled={!product.available}
              >
                Write a Review
              </button>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
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
                      </div>
                    </div>
                    <div className="review-rating">
                      {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
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
                    {new Date(review.reviewDate).toLocaleDateString('en-US', {
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

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Write a Review</h2>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitReview} className="review-form">
              <div className="form-group">
                <label>Rating</label>
                <div className="rating-selector">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`rating-star ${num <= reviewRating ? "active" : ""}`}
                      onClick={() => setReviewRating(num)}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowReviewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmittingReview}>
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
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