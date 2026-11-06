import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Card {
  id: number;
  name: string;
  image_url: string;
  rarity: string;
  types: string[];
  hp: number;
  number: string;
}

async function getCards(): Promise<Card[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cards`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch cards');
  return res.json();
}

export default async function CardListPage() {
  const cards = await getCards();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search cards..." className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Link key={card.id} href={`/carte/${card.id}`}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-[3/4] bg-white rounded-lg overflow-hidden mb-2">
                    {card.image_url ? (
                      <Image
                        src={card.image_url}
                        alt={card.name}
                        width={200}
                        height={267}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium">{card.name}</div>
                  <div className="text-xs text-gray-500">#{card.number}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
