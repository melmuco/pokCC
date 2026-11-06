import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

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

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  const card = await getCard(params.id);
  if (!card) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/carte">Indietro</Link>
          </Button>
        </div>

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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Rarità:</span>
                    <Badge className="ml-2 text-xs font-medium">{card.rarity}</Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">HP:</span>
                    <span className="ml-2 font-bold text-lg">{card.hp}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Artista:</span>
                    <span className="ml-2">{card.artist || 'N/D'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Set:</span>
                    <span className="ml-2">{card.set?.series || 'N/D'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href="/collezioni">Aggiungi a Collezione</Link>
              </Button>
              <Button asChild variant="secondary" className="flex-1">
                <Link href={`/valutazione/${card.id}`}>Vedi Valutazione</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}