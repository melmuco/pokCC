export interface Scansione {
  id: number;
  ocrText: string | null;
  setName: string | null;
  cardNumber: string | null;
  cardName: string | null;
  confidence: number | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  matchedCardId: number | null;
  originalUrl: string | null;
  mediumUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Carta {
  id: number;
  name: string;
  image_url: string | null;
  image_url_small: string | null;
  rarity: string | null;
  types: string[];
  hp: number | null;
  artist: string | null;
  number: string | null;
  supertype: string | null;
  basePrice: number | null;
  set: Set | null;
}

export interface Set {
  id: number;
  name: string;
  series: string | null;
  releaseDate: string | null;
  symbolImage: string | null;
}

export interface PriceSnapshot {
  id: number;
  card_id: number;
  source: string;
  date: string;
  low: number | null;
  high: number | null;
  mid: number | null;
  volume: number | null;
  createdAt: string;
}

export interface CardValuation {
  currentValue: number;
  trend: number;
  collectionValue: number;
  priceHistory: PriceHistoryPoint[];
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface CollectionValuation {
  totalValue: number;
  cardCount: number;
  breakdown?: SetValuation[];
}

export interface SetValuation {
  setName: string;
  value: number;
  cardCount: number;
}