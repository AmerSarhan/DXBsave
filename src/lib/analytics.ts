// Thin wrapper around gtag — only fires if GA is loaded
function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as unknown as { gtag: (...a: unknown[]) => void }).gtag(...args);
  }
}

export function trackDealView(dealName: string, category: string, emirate: string) {
  gtag('event', 'deal_view', {
    deal_name: dealName,
    deal_category: category,
    deal_emirate: emirate,
  });
}

export function trackDealShare(dealName: string, category: string, method: string) {
  gtag('event', 'deal_share', {
    deal_name: dealName,
    deal_category: category,
    share_method: method,
  });
}

export function trackDealFavorite(dealName: string, category: string, action: 'add' | 'remove') {
  gtag('event', 'deal_favorite', {
    deal_name: dealName,
    deal_category: category,
    favorite_action: action,
  });
}

export function trackCategoryFilter(category: string) {
  gtag('event', 'category_filter', {
    selected_category: category,
  });
}

export function trackEmirateFilter(emirate: string) {
  gtag('event', 'emirate_filter', {
    selected_emirate: emirate,
  });
}

export function trackSearch(query: string, resultCount: number) {
  gtag('event', 'search', {
    search_term: query,
    result_count: resultCount,
  });
}

export function trackAskQuery(query: string) {
  gtag('event', 'ai_ask', {
    ask_query: query,
  });
}
