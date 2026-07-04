import { useState, useEffect } from "react";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import { StallCard } from "../components/StallCard";
import { getStalls } from "../services/stall.service";
import { getProductsByStall } from "../services/product.service";
import tupLogo from "../../images/Logo.png";
import "../styles/LandingPage.css";

const PRODUCT_CATEGORIES = ["Rice Meal", "Beverage", "Snacks", "Add-ons"];

interface LandingPageProps {
    onNavigate: (page: string, data?: any) => void;
    token?: string | null;
    onLogout?: () => void;
}

export function LandingPage({ onNavigate, token, onLogout }: LandingPageProps) {
    const [stalls, setStalls] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [animating, setAnimating] = useState(false);

    const heroImages = [
        "/images/foods/beverage.png",
        "/images/foods/burger.png",
        "/images/foods/crispybite.png",
        "/images/foods/donut.png",
        "/images/foods/egg.png",
        "/images/foods/fries.png",
        "/images/foods/juice.png",
        "/images/foods/lemonade.png",
        "/images/foods/lemonade1.png",
        "/images/foods/matcha.png",
        "/images/foods/pizza.png",
        "/images/foods/ricemeal.png",
        "/images/foods/sandwich.png",
        "/images/foods/snacks.png",
        "/images/foods/soda.png",
        "/images/foods/soda1.png",
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

    async function loadData() {
        setIsLoading(true);
        try {
            const stallData = await getStalls();
            const openStalls = stallData.filter(s => s.status === true);
            setStalls(openStalls);

            const allProductsData: any[] = [];
            for (const stall of openStalls) {
                try {
                    const products = await getProductsByStall(stall._id, { available: true });
                    const productsWithStall = products.map(p => ({
                        ...p,
                        stallId: stall._id,
                        stallName: stall.stallName,
                        stallPicture: stall.stallPicture
                    }));
                    allProductsData.push(...productsWithStall);
                } catch (err) {
                    console.error(`Error loading products for stall ${stall.stallName}:`, err);
                }
            }
            setAllProducts(allProductsData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    }

    function productsByCategory(category: string) {
        return allProducts.filter(p => p.category === category);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const query = searchQuery.trim().toLowerCase();
        if (!query && selectedCategory === "All") {
            setSearchResults(null);
            return;
        }
        let filtered = [...allProducts];
        if (query) {
            filtered = filtered.filter(p =>
                p.productName?.toLowerCase().includes(query) ||
                p.productDescription?.toLowerCase().includes(query) ||
                p.category?.toLowerCase().includes(query) ||
                p.stallName?.toLowerCase().includes(query)
            );
        }
        if (selectedCategory !== "All") {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }
        setSearchResults(filtered);
    }

    function clearSearch() {
        setSearchQuery("");
        setSelectedCategory("All");
        setSearchResults(null);
    }

    return (
        <div className="landing-page">
            {/* ─── HERO SECTION ─── */}
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
                        document.getElementById('lp-product-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                        Explore Now
                    </button>
                </div>
            </section>

            {/* ─── PRODUCT SECTION (white, 4 category rails) ─── */}
            <section className="lp-product-section" id="lp-product-section">
                <div className="lp-section-header">
                    <h2 className="lp-section-title">What's Cooking Today</h2>
                </div>

                {isLoading ? (
                    <div className="loading-text">Loading products...</div>
                ) : (
                    <>
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
                                                token={token || undefined}
                                                onClick={() => onNavigate("product", product._id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {allProducts.length === 0 && (
                            <div className="empty-products">
                                <div className="empty-icon">🍽️</div>
                                <h3>No products found</h3>
                                <p>Check back soon for available items.</p>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* ─── STALL SECTION (orange) ─── */}
            <section className="lp-stall-section">
                <div className="lp-section-header">
                    <h2 className="lp-section-title lp-section-title-light">Available Stalls</h2>
                    <button className="lp-see-all" onClick={() => onNavigate("stalls")}>
                        See All →
                    </button>
                </div>
                {isLoading ? (
                    <div className="loading-text loading-text-light">Loading stalls...</div>
                ) : stalls.length === 0 ? (
                    <div className="empty-products">
                        <div className="empty-icon">🏪</div>
                        <h3>No stalls open right now</h3>
                        <p>Check back during canteen hours.</p>
                    </div>
                ) : (
                    <div className="lp-stalls-rail">
                        {stalls.slice(0, 8).map((stall) => (
                            <StallCard
                                key={stall._id}
                                stall={stall}
                                onClick={() => onNavigate("stall", stall._id)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ─── SEARCH SECTION (yellow, expands on search) ─── */}
            <section className={`lp-search-section ${searchResults !== null ? "expanded" : ""}`} id="search-section">
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
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="lp-filter-select"
                                >
                                    <option value="All">All</option>
                                    {PRODUCT_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {searchResults !== null && (
                                <button
                                    type="button"
                                    className="lp-clear-filters"
                                    onClick={clearSearch}
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    </form>

                    {searchResults !== null && (
                        <div className="lp-search-results">
                            <div className="lp-results-count">
                                {searchResults.length === 0
                                    ? "No products found"
                                    : `Showing ${searchResults.length} product${searchResults.length === 1 ? "" : "s"}`}
                            </div>
                            {searchResults.length > 0 && (
                                <div className="lp-products-grid">
                                    {searchResults.map((product) => (
                                        <ProductCard
                                            key={product._id}
                                            product={product}
                                            token={token || undefined}
                                            onClick={() => onNavigate("product", product._id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

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