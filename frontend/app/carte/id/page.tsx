import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

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
  set: {
    name: string;
    series: string;
  } | null;
}

const rarityColors: Record<string, string> = {
  'Common': 'bg-gray-100 text-gray-700',
  'Uncommon': 'bg-green-100 text-green-700',
  'Rare': 'bg-blue-100 text-blue-700',
  'Rare Holo': 'bg-purple-100 text-purple-700',
  'Promo': 'bg-yellow-100 text-yellow-700',
};

async function getCard(id: string): Promise<CardDetail> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cards/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Card not found');
  return res.json();
}

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  let card: CardDetail | null = null;

  try {
    card = await getCard(params.id);
  } catch {
    notFound();
  }

  if (!card) {
    notFound();
  }

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
                  Image not available
                </div>
              )}
            </div>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{card.name}</CardTitle>
                <p className="text-sm text-gray-500">
                  #{card.number} • {card.set?.name || 'Unknown Set'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-sm text-gray-600">HP:</span>
                      <span className="ml-2 font-bold text-lg">{card.hp}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Type:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {card.types?.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600">Supertype:</span>
                    <span className="ml-2">{card.supertype}</span>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600">Rarity:</span>
                    <Badge className={`ml-2 text-xs font-medium ${RarityBadge}`}>{card.rarity}</Badge>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600">Set:</span>
                    <span className="ml-2">{card.set?.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({card.set?.series})</span>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600">Artist:</span>
                    <span className="ml-2">{card.artist}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
