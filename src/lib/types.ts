export type CategoryKey = 'hotels' | 'dining' | 'attractions' | 'delivery' | 'spa' | 'shopping' | 'eid';

export interface BaseDeal {
  id: string;
  category: CategoryKey;
  name: string;
  emirate: string;
  location: string;
  offer: string;
  price: string;
  validUntil: string;
  expiresAt: Date | null;
  isExpiringSoon: boolean;
  slug: string;
  notes: string;
}

export interface HotelDeal extends BaseDeal {
  category: 'hotels';
  tier: string;
  normalRate: string;
  discount: string;
  inclusions: string;
  residentOnly: boolean;
  bookVia: string;
}

export interface DiningDeal extends BaseDeal {
  category: 'dining';
  offerCategory: string;
  days: string;
  timing: string;
  contact: string;
  terms: string;
  isNew: boolean;
}

export interface AttractionDeal extends BaseDeal {
  category: 'attractions';
  offerCategory: string;
  booking: string;
}

export interface DeliveryDeal extends BaseDeal {
  category: 'delivery';
  platform: string;
  promoCode: string;
  discount: string;
  minOrder: string;
  terms: string;
  coverage: string;
}

export interface SpaDeal extends BaseDeal {
  category: 'spa';
  normalPrice: string;
  discount: string;
  inclusions: string;
  booking: string;
}

export interface ShoppingDeal extends BaseDeal {
  category: 'shopping';
  details: string;
  dates: string;
}

export interface EidDeal extends BaseDeal {
  category: 'eid';
  offerSummary: string;
  booking: string;
  status: string;
}

export type AnyDeal = HotelDeal | DiningDeal | AttractionDeal | DeliveryDeal | SpaDeal | ShoppingDeal | EidDeal;

export interface MarketTip {
  tipNumber: string;
  category: string;
  title: string;
  details: string;
}

export interface SheetData {
  hotels: HotelDeal[];
  dining: DiningDeal[];
  attractions: AttractionDeal[];
  delivery: DeliveryDeal[];
  spa: SpaDeal[];
  shopping: ShoppingDeal[];
  eid: EidDeal[];
  tips: MarketTip[];
}

export type SortOption = 'default' | 'price-low' | 'expiring-soon';

export interface FilterState {
  emirate: string;
  category: CategoryKey | 'all';
  search: string;
  sort: SortOption;
}
