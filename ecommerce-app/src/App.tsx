import { useState, useCallback } from "react";
import "./App.css";
import ProductContainer from "./ProductContainer";
import { useAdvancedInfiniteScroll } from "./hooks/useAdvancedInfiniteScroll";
import { useDebounce } from "./hooks/useDebounce";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
	SkeletonCard,
	LoadingSpinner,
	ErrorState,
	EmptyState,
	EndOfListIndicator,
} from "./components/LoadingStates";
// import { ApiCallLogger } from './components/ApiCallLogger';
type Product = {
	id: number;
	title: string;
	description: string;
	category: string;
	price: number;
	rating: number;
	thumbnail: string;
	brand: string;
	discountPercentage: number;
};

type ApiResponse = {
	products: Product[];
	total: number;
	skip: number;
	limit: number;
};

function App() {
	const [searchInput, setSearchInput] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("");
	
	// Debounce the search input to avoid excessive API calls
	const searchQuery = useDebounce(searchInput, 500);
	
	// Track if search is being debounced
	const isSearchPending = searchInput !== searchQuery;

	// Enhanced fetch function with error handling
	const fetchProducts = useCallback(
		async (page: number, signal: AbortSignal) => {
			const limit = 6;
			const skip = page * limit;

			let url = `https://dummyjson.com/products?limit=${limit}&skip=${skip}`;

			if (searchQuery) {
				url = `https://dummyjson.com/products/search?q=${encodeURIComponent(
					searchQuery
				)}&limit=${limit}&skip=${skip}`;
			} else if (selectedCategory) {
				url = `https://dummyjson.com/products/category/${encodeURIComponent(
					selectedCategory
				)}?limit=${limit}&skip=${skip}`;
			}

			const response = await fetch(url, { signal });
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: ApiResponse = await response.json();

			return {
				data: data.products,
				hasMore: data.products.length === limit && skip + limit < data.total,
				total: data.total,
			};
		},
		[searchQuery, selectedCategory]
	);

	const {
		data: products,
		loading,
		error,
		hasMore,
		isRetrying,
		currentPage,
		totalCount,
		retry,
		refresh,
		sentinelRef,
	} = useAdvancedInfiniteScroll({
		fetchData: fetchProducts,
		initialPage: 0,
		threshold: 300,
		enabled: true,
		resetDependencies: [searchQuery, selectedCategory],
		onError: (error) => {
			console.error("Failed to fetch products:", error);
		},
		onSuccess: (data, page) => {
			console.log(
				`Successfully loaded page ${page} with ${data.length} products`
			);
		},
		debounceMs: 300,
		retryAttempts: 3,
		retryDelay: 1000,
	});

	const handleSearch = (query: string) => {
		setSearchInput(query);
		setSelectedCategory(""); // Clear category when searching
	};

	const handleCategoryChange = (category: string) => {
		setSelectedCategory(category);
		setSearchInput(""); // Clear search when selecting category
	};

	const handleRefresh = () => {
		setSearchInput("");
		setSelectedCategory("");
		refresh();
	};

	return (
		<ErrorBoundary>
			<div className="app">
				<header className="app-header">
					<h1 className="app-title">🛍️ Shop Everything</h1>
					<p className="app-subtitle">
						Discover amazing products at unbeatable prices
					</p>

					{/* Search and Filter Controls */}
					<div className="controls">
						<div className="search-container">
							<input
								type="text"
								placeholder="Search products..."
								value={searchInput}
								onChange={(e) => handleSearch(e.target.value)}
								className="search-input"
							/>
							{isSearchPending && (
								<div className="search-pending-indicator">
									<span className="search-spinner">⏳</span>
								</div>
							)}
						</div>

						<div className="filter-container">
							<select
								value={selectedCategory}
								onChange={(e) => handleCategoryChange(e.target.value)}
								className="category-select"
							>
								<option value="">All Categories</option>
								<option value="smartphones">Smartphones</option>
								<option value="laptops">Laptops</option>
								<option value="fragrances">Fragrances</option>
								<option value="skincare">Skincare</option>
								<option value="groceries">Groceries</option>
								<option value="home-decoration">Home Decoration</option>
							</select>
						</div>

						<button onClick={handleRefresh} className="refresh-button">
							Refresh
						</button>
					</div>

					{/* Stats */}
					{totalCount !== null && (
						<div className="stats">
							<span>
								Showing {products.length} of {totalCount} products
							</span>
							{currentPage > 0 && <span> • Page {currentPage + 1}</span>}
							{isRetrying && <span> • Retrying...</span>}
						</div>
					)}
				</header>

				<main className="main-content">
					{/* Empty State */}
					{!loading && products.length === 0 && !error && (
						<EmptyState
							message={
								searchQuery ? "No products found" : "No products available"
							}
							description={
								searchQuery
									? `Try adjusting your search for "${searchQuery}"`
									: "Check back later for new products"
							}
							action={
								<button onClick={handleRefresh} className="retry-button">
									Refresh
								</button>
							}
						/>
					)}

					{/* Error State */}
					{error && !loading && (
						<ErrorState
							error={error}
							onRetry={retry}
							message="Failed to load products"
						/>
					)}

					{/* Products Grid */}
					{products.length > 0 && (
						<div className="products-grid">
							{products.map((product) => (
								<ProductContainer key={product.id} products={product} />
							))}

							{/* Loading Skeleton for next items */}
							{loading && <SkeletonCard count={3} />}
						</div>
					)}

					{/* Initial Loading */}
					{loading && products.length === 0 && (
						<div className="products-grid">
							<SkeletonCard count={6} />
						</div>
					)}

					{/* Load More Spinner */}
					{loading && products.length > 0 && (
						<LoadingSpinner
							text={isRetrying ? "Retrying..." : "Loading more products..."}
							size="medium"
						/>
					)}

					{/* End of List */}
					{!hasMore && products.length > 0 && !loading && (
						<EndOfListIndicator message="🎉 You've seen all available products!" />
					)}

					{/* Intersection Observer Sentinel */}
					<div ref={sentinelRef} className="sentinel" />
				</main>
			</div>
		</ErrorBoundary>
	);
}

export default App;
