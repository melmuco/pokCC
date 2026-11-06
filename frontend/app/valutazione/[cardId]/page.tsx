import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';

interface PriceHistoryPoint {
  date: string;
  price: number;
}

interface CardDetail {
  id: number;
  name: string;
  image_url: string;
  image_url_small: string;
  rarity: string;
  types: string[];
  hp: number;
  artist: string;
  number: string;
  supertype: string;
  basePrice: number | null;
  set: {
    name: string;
    series: string;
  } | null;
}

interface ValuationData {
  currentValue: number;
  trend: number;
  finalPrice: number;
  priceHistory: PriceHistoryPoint[];
}

const rarityColors: Record<string, string> = {
  'Common': 'bg-gray-100 text-gray-700',
  'Uncommon': 'bg-green-100 text-green-700',
  'Rare': 'bg-blue-100 text-blue-700',
  'Rare Holo': 'bg-purple-100 text-purple-700',
  'Rare V': 'bg-indigo-100 text-indigo-700',
  'Promo': 'bg-yellow-100 text-yellow-700',
};

async function getCard(id: string): Promise<CardDetail | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cards/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getValuation(id: string): Promise<ValuationData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pricing/card/${id}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return { currentValue: 0, trend: 0, finalPrice: 0, priceHistory: [] };
  return res.json();
}

async function syncPrice(id: string, token: string | null): Promise<void> {
  if (!token) return;
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pricing/card/${id}/snapshot`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

function PriceChart({ history }: { history: PriceHistoryPoint[] }) {
  if (history.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-400">Nessun dato storico</div>;
  }

  const maxPrice = Math.max(...history.map((h) => h.price));
  const minPrice = Math.min(...history.map((h) => h.price));
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="h-48 bg-white rounded-lg border p-3">
      <div className="flex items-end h-full gap-1">
        {history.map((point, i) => {
          const height = ((point.price - minPrice) / priceRange) * 100 || 10;
          return (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className="w-4 h-20 bg-blue-500 rounded-t"></div>
              <span className="text-xs mt-1 text-gray-500">{point.date.split('-')[1]}/{point.date.split('-')[2]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function CardValuationPage({ params }: { params: { cardId: string } }) {
  let card: CardDetail | null = null;
  let valuation: ValuationData;

  try {
    card = await getCard(params.cardId);
  } catch {
    notFound();
  }

  if (!card) {
    notFound();
  }

  valuation = await getValuation(params.cardId);

  const trendColor = valuation.trend >= 0 ? 'text-green-600' : 'text-red-600';
  const TrendIcon = valuation.trend >= 0 ? TrendingUp : TrendingDown;
  const RarityBadge = rarityColors[card.rarity] || 'bg-gray-100 text-gray-700';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-[3/4] bg-white rounded-lg shadow-lg overflow-hidden">
              {card.image_url ? (
                <Image
                  src={card.image_url}
                  alt={card.name}
                  width={300}
                  height={400}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Immagine non disponibile
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{card.name}</CardTitle>
                <CardDescription>
                  #{card.number} • {card.set?.name || 'Unknown Set'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Rarità:</span>
                      <Badge className={`ml-2 text-xs font-medium ${RarityBadge}`}>
                        {card.rarity}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">HP:</span>
                      <span className="ml-2 font-bold text-lg">{card.hp}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-2">Valutazione del mercato</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Prezzo attuale</p>
                        <p className="text-xl font-bold text-blue-600">
                          €{valuation.currentValue.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Trend 30gg</p>
                        <div className="flex items-center justify-center">
                          <TrendIcon className={`w-4 h-4 mr-1 ${trendColor}`} />
                          <span className={`font-bold ${trendColor}`}>
                            {valuation.trend.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Valore finale</p>
                        <p className="text-xl font-bold text-green-600">
                          €{valuation.finalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Aggiorna prezzo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storico prezzi (30 giorni)</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceChart history={valuation.priceHistory} />
                <div className="mt-3 text-sm text-gray-500">
                  <p>Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Suggerimenti per la vendita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {valuation.trend > 10 && (
                  <p className="text-green-600">
                    <strong>Consiglio:</strong> Il prezzo sta aumentando rapidamente. Considera la vendita ora.
                  </p>
                )}
                {valuation.trend < -10 && (
                  <p className="text-red-600">
                    <strong>Attenzione:</strong> Il prezzo sta diminuendo. Valuta di ritardare la vendita.
                  </p>
                )}
                {valuation.trend >= -10 && valuation.trend <= 10 && (
                  <p className="text-gray-600">
                    Il prezzo è stabile. Vendi quando trovi un acquirente adeguato.
                  </p>
                )}
                {valuation.currentValue < 1 && (
                  <p className="text-amber-600">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Prezzo non disponibile o troppo basso. Verifica i dati TCG.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}