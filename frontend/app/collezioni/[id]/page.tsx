'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, DollarSign, Download } from 'lucide-react';
import axios from 'axios';
import Image from 'next/image';
import { exportCollectionCSV } from '@/lib/api';
import { toast } from 'sonner';

interface Carta {
  id: number;
  name: string;
  image_url: string | null;
  set: { name: string } | null;
  rarity: string;
  basePrice: number;
}

interface CartaInCollezione {
  id: number;
  quantity: number;
  condition: string | null;
  graded_company: string | null;
  graded_grade: number | null;
  carta: Carta;
}

interface Collezione {
  id: number;
  nome: string;
  descrizione: string | null;
  is_public: boolean;
  image_url: string | null;
  carte: CartaInCollezione[];
}

interface CollectionValuationBreakdown {
  setName: string;
  cardName: string;
  currentPrice: number;
  collectionValue: number;
  quantity: number;
  condition: string | null;
  graded: boolean;
}

interface CollectionValuation {
  totalValue: number;
  cardCount: number;
  breakdown: CollectionValuationBreakdown[];
}

const CONDITION_LABELS: Record<string, string> = {
  NearMint: 'Near Mint',
  LightPlay: 'Light Play',
  Play: 'Played',
  Moderate: 'Moderate',
  Heavy: 'Heavy',
  Damaged: 'Damaged',
};

const RARITY_COLORS: Record<string, string> = {
  'Common': 'bg-gray-100 text-gray-700',
  'Uncommon': 'bg-green-100 text-green-700',
  'Rare': 'bg-blue-100 text-blue-700',
  'Rare Holo': 'bg-purple-100 text-purple-700',
  'Rare V': 'bg-indigo-100 text-indigo-700',
  'Rare VMAX': 'bg-pink-100 text-pink-700',
  'Ultra Rare': 'bg-yellow-100 text-yellow-700',
  'Legend': 'bg-red-100 text-red-700',
  'Promo': 'bg-orange-100 text-orange-700',
};

async function getCollection(id: number): Promise<Collezione | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/collections/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch {
    return null;
  }
}

async function getCollectionValuation(id: number): Promise<CollectionValuation> {
  const token = localStorage.getItem('token');
  if (!token) return { totalValue: 0, cardCount: 0, breakdown: [] };

  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/valuation/collection/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch {
    return { totalValue: 0, cardCount: 0, breakdown: [] };
  }
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState<Collezione | null>(null);
  const [valuation, setValuation] = useState<CollectionValuation>({ totalValue: 0, cardCount: 0, breakdown: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    async function loadData() {
      const colData = await getCollection(parseInt(id));
      const valuationData = await getCollectionValuation(parseInt(id));

      setCollection(colData);
      setValuation(valuationData);
      setLoading(false);
    }

    loadData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Collezione non trovata</p>
        <Button onClick={() => router.push('/collezioni')} className="ml-4">
          Torna alle collezioni
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push('/collezioni')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">{collection.nome}</h1>
          {collection.descrizione && (
            <p className="text-gray-600 mt-1">{collection.descrizione}</p>
          )}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-gray-500">
              Carte: {collection.carte?.length || 0}
            </span>
            {valuation.totalValue > 0 && (
              <p className="text-green-600 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Valore totale: €{valuation.totalValue.toFixed(2)}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await exportCollectionCSV(collection.id);
                  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `collezione-${collection.nome}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  toast.success('CSV esportato con successo');
                } catch (error) {
                  toast.error('Errore durante l\'esportazione');
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Esporta CSV
            </Button>
          </div>
        </div>

        {collection.carte && collection.carte.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.carte.map((item) => {
              const breakdown = valuation.breakdown.find(b => b.cardName === item.carta.name && b.setName === (item.carta.set?.name || 'Unknown'));
              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex justify-between items-start">
                      <span className="truncate">{item.carta.name}</span>
                      <Badge className={RARITY_COLORS[item.carta.rarity] || 'bg-gray-100 text-gray-700'}>
                        {item.carta.rarity}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {item.carta.set?.name || 'Unknown Set'} #{item.carta.id}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm">
                        <div className="font-medium">Quantità: {item.quantity}</div>
                        <div className="text-xs text-gray-500">
                          {item.condition && `Condizione: ${CONDITION_LABELS[item.condition]}`}
                        </div>
                        {item.graded_company && (
                          <div className="text-xs text-gray-500">
                            Graded: {item.graded_company} {item.graded_grade}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          €{breakdown?.collectionValue.toFixed(2) || item.carta.basePrice?.toFixed(2) || '0.00'}
                        </div>
                        {breakdown && (
                          <div className="text-xs text-gray-500">
                            x{
                              (breakdown.currentPrice > 0
                                ? breakdown.collectionValue / (breakdown.currentPrice * breakdown.quantity)
                                : 1)
                              .toFixed(2)
                            }
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/carte/${item.carta.id}/grading`)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Modifica Grading
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Nessuna carta nella collezione</p>
          </div>
        )}
      </div>
    </div>
  );
}