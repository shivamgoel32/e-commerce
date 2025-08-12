import { useState, useEffect, useCallback, useRef } from "react";

interface UseAdvancedInfiniteScrollOptions<T> {
	fetchData: (
		page: number,
		signal: AbortSignal
	) => Promise<{ data: T[]; hasMore: boolean; total?: number }>;
	initialPage?: number;
	threshold?: number;
	enabled?: boolean;
	resetDependencies?: unknown[];
	onError?: (error: Error) => void;
	onSuccess?: (data: T[], page: number) => void;
	debounceMs?: number;
	retryAttempts?: number;
	retryDelay?: number;
}

interface UseAdvancedInfiniteScrollReturn<T> {
	data: T[];
	loading: boolean;
	error: Error | null;
	hasMore: boolean;
	isRetrying: boolean;
	currentPage: number;
	totalCount: number | null;
	loadMore: () => void;
	retry: () => void;
	reset: () => void;
	refresh: () => void;
	sentinelRef: (node: HTMLDivElement | null) => void;
}

export function useAdvancedInfiniteScroll<T = Record<string, unknown>>({
	fetchData,
	initialPage = 0,
	threshold = 300,
	enabled = true,
	resetDependencies = [],
	onError,
	onSuccess,
	debounceMs = 200,
	retryAttempts = 3,
	retryDelay = 1000,
}: UseAdvancedInfiniteScrollOptions<T>): UseAdvancedInfiniteScrollReturn<T> {
	// Core state
	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const [isRetrying, setIsRetrying] = useState(false);
	const [currentPage, setCurrentPage] = useState(initialPage);
	const [totalCount, setTotalCount] = useState<number | null>(null);

	// Refs for stable references
	const abortControllerRef = useRef<AbortController | null>(null);
	const loadingRef = useRef(false);
	const hasMoreRef = useRef(true);
	const enabledRef = useRef(enabled);
	const retryCountRef = useRef(0);
	const debounceTimerRef = useRef<number | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const currentRequestPageRef = useRef<number | null>(null);
	const isInitialLoadingRef = useRef(false);
	const initialLoadRef = useRef(false);

	// Update refs when state changes
	useEffect(() => {
		loadingRef.current = loading;
	}, [loading]);

	useEffect(() => {
		hasMoreRef.current = hasMore;
	}, [hasMore]);

	useEffect(() => {
		enabledRef.current = enabled;
	}, [enabled]);

	// Abort previous request when component unmounts or dependencies change
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	// Reset data when dependencies change
	useEffect(() => {
		if (resetDependencies.length > 0) {
			reset();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, resetDependencies);

	// Core fetch function with error handling and retries
	const fetchWithRetry = useCallback(
		async (
			page: number,
			isInitial: boolean = false,
			retryCount: number = 0
		): Promise<void> => {
			// Prevent duplicate requests for the same page
			if (!enabledRef.current || loadingRef.current) return;
			
			// Check if we're already requesting this page
			if (currentRequestPageRef.current === page && !isInitial) {
				console.log(`Duplicate request prevented for page ${page}`);
				return;
			}
			
			// For initial loads, prevent multiple initial loads
			if (isInitial && isInitialLoadingRef.current) {
				console.log('Duplicate initial load prevented');
				return;
			}

			// Set the current request page
			currentRequestPageRef.current = page;
			if (isInitial) {
				isInitialLoadingRef.current = true;
			}

			// Abort previous request
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			// Create new abort controller
			abortControllerRef.current = new AbortController();
			const signal = abortControllerRef.current.signal;

			setLoading(true);
			setError(null);

			if (retryCount > 0) {
				setIsRetrying(true);
			}

			try {
				const result = await fetchData(page, signal);

				// Check if request was aborted
				if (signal.aborted) return;

				const { data: newData, hasMore: moreAvailable, total } = result;

				// Update data
				setData((prevData) =>
					isInitial ? newData : [...prevData, ...newData]
				);
				setHasMore(moreAvailable);
				setCurrentPage(page);

				if (total !== undefined) {
					setTotalCount(total);
				}

				// Reset retry count on success
				retryCountRef.current = 0;
				setIsRetrying(false);

				// Call success callback
				onSuccess?.(newData, page);
			} catch (err) {
				if (signal.aborted) return;

				const error =
					err instanceof Error ? err : new Error("An error occurred");

				// Retry logic
				if (retryCount < retryAttempts && !signal.aborted) {
					retryCountRef.current = retryCount + 1;

					setTimeout(() => {
						if (!signal.aborted) {
							fetchWithRetry(page, isInitial, retryCount + 1);
						}
					}, retryDelay * Math.pow(2, retryCount)); // Exponential backoff

					return;
				}

				// Set error if max retries reached
				setError(error);
				setIsRetrying(false);
				onError?.(error);
			} finally {
				if (!signal.aborted) {
					setLoading(false);
					// Clear the current request page
					currentRequestPageRef.current = null;
					if (isInitial) {
						isInitialLoadingRef.current = false;
					}
				}
			}
		},
		[fetchData, onError, onSuccess, retryAttempts, retryDelay]
	);

	// Debounced scroll handler
	const debouncedScrollHandler = useCallback(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			const { scrollTop, scrollHeight, clientHeight } =
				document.documentElement;

			if (
				scrollTop + clientHeight >= scrollHeight - threshold &&
				!loadingRef.current &&
				hasMoreRef.current &&
				enabledRef.current &&
				currentRequestPageRef.current === null // Only if no request is in progress
			) {
				const nextPage = currentPage + 1;
				console.log(`Scroll handler triggering load for page ${nextPage}`);
				fetchWithRetry(nextPage);
			}
		}, debounceMs);
	}, [currentPage, threshold, debounceMs, fetchWithRetry]);

	// Intersection Observer for better performance (alternative to scroll)
	useEffect(() => {
		if (!sentinelRef.current) return;

		observerRef.current = new IntersectionObserver(
			(entries) => {
				const target = entries[0];
				if (
					target.isIntersecting &&
					!loadingRef.current &&
					hasMoreRef.current &&
					enabledRef.current &&
					currentRequestPageRef.current === null // Only if no request is in progress
				) {
					const nextPage = currentPage + 1;
					console.log(`Intersection observer triggering load for page ${nextPage}`);
					fetchWithRetry(nextPage);
				}
			},
			{
				rootMargin: `${threshold}px`,
				threshold: 0.1,
			}
		);

		observerRef.current.observe(sentinelRef.current);

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, [currentPage, threshold, fetchWithRetry]);

	// Scroll event listener (fallback)
	useEffect(() => {
		if (!enabled) return;

		window.addEventListener("scroll", debouncedScrollHandler, {
			passive: true,
		});

		return () => {
			window.removeEventListener("scroll", debouncedScrollHandler);
		};
	}, [debouncedScrollHandler, enabled]);

	// Handle visibility change (pause when tab is not active)
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				// Pause when tab is not visible
				enabledRef.current = false;
			} else {
				// Resume when tab becomes visible
				enabledRef.current = enabled;
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [enabled]);

	// Public methods
	const loadMore = useCallback(() => {
		if (!loading && hasMore && enabled && currentRequestPageRef.current === null) {
			const nextPage = currentPage + 1;
			console.log(`Manual loadMore triggering load for page ${nextPage}`);
			fetchWithRetry(nextPage);
		}
	}, [loading, hasMore, enabled, currentPage, fetchWithRetry]);

	const retry = useCallback(() => {
		if (error) {
			fetchWithRetry(currentPage, false, 0);
		}
	}, [error, currentPage, fetchWithRetry]);

	const reset = useCallback(() => {
		// Abort any ongoing requests
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Clear debounce timer
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		// Reset all state
		setData([]);
		setLoading(false);
		setError(null);
		setHasMore(true);
		setIsRetrying(false);
		setCurrentPage(initialPage);
		setTotalCount(null);
		retryCountRef.current = 0;
		
		// Reset request tracking refs
		currentRequestPageRef.current = null;
		isInitialLoadingRef.current = false;
		initialLoadRef.current = false;
	}, [initialPage]);

	const refresh = useCallback(() => {
		reset();
		// Small delay to ensure reset is complete
		setTimeout(() => {
			fetchWithRetry(initialPage, true);
		}, 0);
	}, [reset, initialPage, fetchWithRetry]);

	// Initial load - simplified to prevent multiple calls
	useEffect(() => {
		// Only do initial load if we have no data, we're not loading, and haven't done initial load yet
		if (enabled && data.length === 0 && !loading && !initialLoadRef.current && !isInitialLoadingRef.current) {
			console.log('Starting initial load');
			initialLoadRef.current = true;
			fetchWithRetry(initialPage, true);
		}
	}, [enabled, data.length, loading, initialPage, fetchWithRetry]);

	// Create sentinel element ref callback
	const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
		sentinelRef.current = node;
	}, []);

	return {
		data,
		loading,
		error,
		hasMore,
		isRetrying,
		currentPage,
		totalCount,
		loadMore,
		retry,
		reset,
		refresh,
		sentinelRef: setSentinelRef,
	};
}
