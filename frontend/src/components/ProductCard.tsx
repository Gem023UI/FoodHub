import "../styles/ProductCard.css";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    photos: string[];
    nutrition: {
      calories: number | null;
      proteinGrams: number | null;
    };
    averageRating: number;
    isAvailable: boolean;
  };
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const imageUrl = product.photos && product.photos.length > 0 
    ? product.photos[0] 
    : "https://via.placeholder.com/200x200?text=No+Image";

  return (
    <div className="product-card" onClick={onClick}>
      <div className="product-card-image">
        <img src={imageUrl} alt={product.name} />
        {!product.isAvailable && (
          <span className="product-unavailable-badge">Unavailable</span>
        )}
      </div>
      <div className="product-card-info">
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-meta">
          <span className="product-card-price">₱{product.price.toFixed(2)}</span>
          {product.averageRating > 0 && (
            <span className="product-card-rating">
              ⭐ {product.averageRating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="product-card-nutrition">
          {product.nutrition.calories && (
            <span className="nutrition-badge">
              🔥 {product.nutrition.calories} cal
            </span>
          )}
          {product.nutrition.proteinGrams && (
            <span className="nutrition-badge">
              💪 {product.nutrition.proteinGrams}g protein
            </span>
          )}
        </div>
      </div>
    </div>
  );
}