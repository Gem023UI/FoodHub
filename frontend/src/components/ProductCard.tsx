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