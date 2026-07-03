import React, { useEffect, useState } from "react";
import "../styles/ProductCard.css";
import { toggleFavorite, checkFavorite } from "../services/favorite.service";

type ProductCategory = "Rice Meal" | "Beverage" | "Snacks" | "Add-ons";

interface ProductCardProps {
  product: {
    _id: string;
    productName: string;
    price: number;
    productImages?: string[];
    category?: ProductCategory | string;
    nutrition?: {
      calories?: number | null;
      protein?: number | null;
      carbs?: number | null;
      allergen?: string;
    };
    favorite?: number;
    available?: boolean;
    stallName?: string;
    stallId?: string;
    averageRating?: number;
    reviewCount?: number;
  };
  token?: string;
  onClick: () => void;
}

// Category → color mapping from the UI guide
const CATEGORY_COLOR: Record<string, string> = {
  "Rice Meal": "red",
  "Snacks": "orange",
  "Beverage": "yellow",
  "Add-ons": "gray",
};

// Function to render star rating
function renderStars(rating: number = 0) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let stars = [];
  
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(<i key={`full-${i}`} className="fas fa-star star-filled"></i>);
  }
  
  // Half star
  if (hasHalfStar) {
    stars.push(<i key="half" className="fas fa-star-half-alt star-half"></i>);
  }
  
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<i key={`empty-${i}`} className="far fa-star star-empty"></i>);
  }
  
  return stars;
}

export function ProductCard({ product, token, onClick }: ProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(product.favorite || 0);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    checkFavorite(token, product._id)
      .then((res) => {
        if (!cancelled) setIsFavorited(res.isFavorited);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, product._id]);

  async function handleHeartClick(event: React.MouseEvent) {
    event.stopPropagation();
    if (!token || isToggling) return;

    setIsToggling(true);
    try {
      const result = await toggleFavorite(token, product._id);
      setIsFavorited(result.isFavorited);
      setFavoriteCount(result.favoriteCount);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setIsToggling(false);
    }
  }

  const imageUrl = product.productImages && product.productImages.length > 0
    ? product.productImages[0]
    : "https://via.placeholder.com/200x200?text=No+Image";

  const colorClass = CATEGORY_COLOR[product.category || ""] || "red";
  
  // Get rating and review count
  const averageRating = product.averageRating || 0;
  const reviewCount = product.reviewCount || 0;

  return (
    <div className={`product-card product-card-${colorClass}`} onClick={onClick}>
      <div className="product-card-image">
        <img src={imageUrl} alt={product.productName} />
        {product.available === false && (
          <span className="product-unavailable-badge">Unavailable</span>
        )}
        <button
          type="button"
          className={`product-favorite-btn ${isFavorited ? "favorited" : ""}`}
          onClick={handleHeartClick}
          disabled={!token || isToggling}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <i className={isFavorited ? "fas fa-heart" : "far fa-heart"}></i>
          <span className="product-favorite-count">{favoriteCount}</span>
        </button>
      </div>

      <div className="product-card-info">
        <h3 className="product-card-name">{product.productName}</h3>
        {product.stallName && (
          <p className="product-card-stall">{product.stallName}</p>
        )}
        <p className="product-card-price">Php.{product.price.toFixed(2)}</p>

        {/* Rating Section */}
        <div className="product-card-rating">
          <div className="stars-container">
            {renderStars(averageRating)}
          </div>
          {reviewCount > 0 && (
            <span className="review-count">({reviewCount})</span>
          )}
          {reviewCount === 0 && (
            <span className="no-reviews">No reviews</span>
          )}
        </div>

        <div className="product-card-nutrition">
          <div>
            <span>{product.nutrition?.calories ?? 0}</span>
            <label>Calories</label>
          </div>
          <div>
            <span>{product.nutrition?.protein ?? 0}g</span>
            <label>Protein</label>
          </div>
          <div>
            <span>{product.nutrition?.carbs ?? 0}g</span>
            <label>Carbs</label>
          </div>
        </div>
      </div>
    </div>
  );
}