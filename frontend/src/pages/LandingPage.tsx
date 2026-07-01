import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import { getStalls, getProductsByStall } from "../lib/api";
import tupLogo from "../../images/Logo.png";
import "../styles/LandingPage.css";

// Product categories from the model
const PRODUCT_CATEGORIES = [
    "All",
    "Rice Meal",
    "Beverage",
    "Snacks",
    "Add-ons"
];

interface LandingPageProps {
    onNavigate: (page: string) => void;
    token?: string | null;
    onLogout?: () => void;
}

export function LandingPage({ onNavigate, token, onLogout }: LandingPageProps) {
    const [stalls, setStalls] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ 
        min: 0, 
        max: 200 
    });
    const [currentSlide, setCurrentSlide] = useState(0);
    const [animating, setAnimating] = useState(false);

    const heroImages = [
        "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545114/50105218-7d1d-4f2b-88ad-e8a74575f75a.png",
        "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545235/13fc304d-e2db-4d59-b425-85c35cc7b372.png",
        "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1782545270/c9ac2d07-9f6a-435c-af8a-c8fb47c8d6c5.png",
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimating(true);
            setTimeout(() => {
                setCurrentSlide((prev) => (prev + 1) % heroImages.length);
                setAnimating(false);
            }, 600);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    // Filter products whenever search, category, or price range changes
    useEffect(() => {
        filterProducts();
    }, [searchQuery, selectedCategory, priceRange, allProducts]);

    async function loadData() {
        setIsLoading(true);
        try {
            const stallData = await getStalls();
            setStalls(stallData.filter(s => s.isActive));

            // Get all products from all stalls
            const allProductsData: any[] = [];
            for (const stall of stallData) {
                if (stall.isActive) {
                    const products = await getProductsByStall(stall._id);
                    allProductsData.push(...products.filter(p => p.isAvailable));
                }
            }
            setAllProducts(allProductsData);
            setFilteredProducts(allProductsData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    }

    function filterProducts() {
        let filtered = [...allProducts];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.category?.toLowerCase().includes(query)
            );
        }

        // Filter by category
        if (selectedCategory !== "All") {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        // Filter by price range
        filtered = filtered.filter(p => 
            p.price >= priceRange.min && p.price <= priceRange.max
        );

        setFilteredProducts(filtered);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        filterProducts();
    }

    function handleCategoryChange(category: string) {
        setSelectedCategory(category);
    }

    function handlePriceChange(type: "min" | "max", value: string) {
        const numValue = Number(value) || 0;
        setPriceRange(prev => ({
            ...prev,
            [type]: numValue
        }));
    }

    const featuredProducts = filteredProducts.slice(0, 6);

    return (
        <div className="landing-page">
            <Header 
                onNavigate={onNavigate} 
                token={token} 
                onLogout={onLogout}
                currentPage="home"
            />

            {/* ─── HERO ─── */}
            <section className="lp-hero">
                <div className="lp-hero-image">
                    <div className="lp-hero-slideshow">
                        <img
                            src={heroImages[currentSlide]}
                            alt="FoodHub"
                            className={`lp-hero-food-img lp-slide ${animating ? "lp-slide-exit" : "lp-slide-enter"}`}
                        />
                    </div>
                </div>
                <div className="lp-hero-content">
                    <h1 className="lp-hero-title">
                        Order Your<br />
                        Favorites in<br />
                        Minutes.
                    </h1>
                    <p className="lp-hero-sub">
                        Discover the best canteen stalls at TUP. Pre-order your meals
                        and skip the queue — fresh food, faster.
                    </p>
                    <button className="lp-hero-btn" onClick={() => {
                        document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                        Explore Now
                    </button>
                </div>
            </section>

            {/* ─── SEARCH AND FILTER SECTION ─── */}
            <section id="search-section" className="lp-search-section">
                <div className="lp-search-container">
                    <h2 className="lp-search-title">Find Your Favorite Food</h2>
                    
                    <form className="lp-search-form" onSubmit={handleSearch}>
                        <div className="lp-search-input-wrapper">
                            <i className="fas fa-search search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search for food, stall, or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="lp-search-input"
                            />
                            <button type="submit" className="lp-search-btn">
                                Search
                            </button>
                        </div>
                        
                        <div className="lp-filters">
                            <div className="lp-filter-group">
                                <label className="lp-filter-label">Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                    className="lp-filter-select"
                                >
                                    {PRODUCT_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="lp-filter-group">
                                <label className="lp-filter-label">Price Range</label>
                                <div className="lp-price-inputs">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min || ""}
                                        onChange={(e) => handlePriceChange("min", e.target.value)}
                                        className="lp-price-input"
                                        min="0"
                                    />
                                    <span className="lp-price-separator">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max || ""}
                                        onChange={(e) => handlePriceChange("max", e.target.value)}
                                        className="lp-price-input"
                                        min="0"
                                    />
                                </div>
                            </div>
                            
                            {(searchQuery || selectedCategory !== "All" || priceRange.min > 0 || priceRange.max < 200) && (
                                <button 
                                    type="button" 
                                    className="lp-clear-filters"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedCategory("All");
                                        setPriceRange({ min: 0, max: 200 });
                                    }}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </form>
                    
                    <div className="lp-results-count">
                        {isLoading ? (
                            <span>Loading products...</span>
                        ) : (
                            <span>Showing {filteredProducts.length} products</span>
                        )}
                    </div>
                </div>
            </section>

            {/* ─── PRODUCTS GRID ─── */}
            <section className="lp-products-section">
                {isLoading ? (
                    <div className="loading-text">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="empty-products">
                        <div className="empty-icon">🍽️</div>
                        <h3>No products found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="lp-products-grid">
                        {filteredProducts.slice(0, 12).map((product) => (
                          <ProductCard
                            key={product._id}
                            product={product}
                            onClick={() => onNavigate(`product/${product._id}`)}
                          />
                        ))}
                    </div>
                )}
            </section>

            {/* ─── STALLS SECTION ─── */}
            {!isLoading && stalls.length > 0 && (
                <section className="lp-featured">
                    <div className="lp-featured-header">
                        <h2 className="lp-section-title">Available Stalls</h2>
                        <button className="lp-see-all" onClick={() => onNavigate("stalls")}>
                            See All →
                        </button>
                    </div>
                    <div className="lp-stalls-grid">
                        {stalls.slice(0, 4).map((stall) => (
                            <div 
                                className="lp-stall-card" 
                                key={stall._id} 
                                onClick={() => onNavigate(`stall/${stall._id}`)}
                            >
                                <div className="lp-stall-img-wrap">
                                    <img 
                                        src={stall.photos?.[0] || tupLogo} 
                                        alt={stall.name} 
                                        className="lp-stall-img" 
                                    />
                                </div>
                                <div className="lp-stall-info">
                                    <h3 className="lp-stall-name">{stall.name}</h3>
                                    <p className="lp-stall-tag">{stall.category || "General"}</p>
                                    <p className="lp-stall-location">
                                        <i className="fas fa-map-marker-alt"></i> {stall.location}
                                    </p>
                                    <div className="lp-stall-footer">
                                        <span className="lp-stall-price">
                                            {stall.openingHours || "Check hours"}
                                        </span>
                                        <button
                                            className="lp-stall-order-btn"
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                onNavigate(`stall/${stall._id}`);
                                            }}
                                        >
                                            View Menu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ─── HOW IT WORKS ─── */}
            <section className="lp-bottom-row">
                <div className="lp-how-card">
                    <h2 className="lp-how-title">Order Food The Smart Way.</h2>
                    <ul className="lp-how-steps">
                        <li>
                            <span className="lp-step-icon">🍽️</span>
                            <div>
                                <strong>Pick a Stall</strong>
                                <p>Browse canteen stalls and explore their menus in seconds.</p>
                            </div>
                        </li>
                        <li>
                            <span className="lp-step-icon">🛒</span>
                            <div>
                                <strong>Pre-Order</strong>
                                <p>Add items to your cart and schedule a pickup time.</p>
                            </div>
                        </li>
                        <li>
                            <span className="lp-step-icon">💳</span>
                            <div>
                                <strong>Pay Online</strong>
                                <p>Pay securely using GCash or Maya via PayMongo.</p>
                            </div>
                        </li>
                    </ul>
                    <button className="lp-how-btn" onClick={() => onNavigate("stalls")}>
                        Get Started
                    </button>
                </div>
                <div className="lp-promo-card">
                    <img src={tupLogo} alt="Promo" className="lp-promo-img" />
                    <h3 className="lp-promo-title">Today's Special</h3>
                    <p className="lp-promo-sub">
                        Fresh meals every day at TUP Canteen. Check the latest promos from your
                        favorite stalls and save more on every order.
                    </p>
                    <button className="lp-promo-btn" onClick={() => onNavigate("trends")}>
                        Check Trends
                    </button>
                </div>
            </section>

            <Footer onNavigate={onNavigate} />
        </div>
    );
}