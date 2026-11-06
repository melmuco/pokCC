'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface Carta {
  id: number;
  name: string;
  image_url: string | null;
  set: { name: string } | null;
}

interface CartaInCollezione {
  id: number;
  quantity: number;
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

interface CollectionValuation {
  totalValue: number;
  cardCount: number;
}

async function getCollections(): Promise<Collezione[]> {
  const token = localStorage.getItem('token');
  if (!token) return [];

  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/collections`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch {
    return [];
  }
}

async function getCollectionValuation(id: number): Promise<CollectionValuation> {
  const token = localStorage.getItem('token');
  if (!token) return { totalValue: 0, cardCount: 0 };

  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/valuation/collection/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch {
    const col = await getCollection(id);
    return { totalValue: 0, cardCount: col?.carte?.length || 0 };
  }
}

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

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collezione[]>([]);
  const [valuationMap, setValuationMap] = useState<Record<number, CollectionValuation>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const cols = await getCollections();
      setCollections(cols);

      const valuationData: Record<number, CollectionValuation> = {};
      for (const col of cols) {
        const valuation = await getCollectionValuation(col.id);
        valuationData[col.id] = valuation;
      }
      setValuationMap(valuationData);
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Le Mie Collezioni</h1>
            {Object.values(valuationMap).some(v => v.totalValue > 0) && (
              <p className="text-green-600 mt-1 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Valore totale: €{Object.values(valuationMap).reduce((sum, v) => sum + v.totalValue, 0).toFixed(2)}
              </p>
            )}
          </div>
          <Link href="/collezioni/nuova">
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Nuova Collezione
            </Button>
          </Link>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nessuna collezione trovata.</p>
            <Link href="/collezioni/nuova" className="block mt-4">
              <Button variant="outline">Crea la prima collezione</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collezione) => {
              const valuation = valuationMap[collezione.id] || { totalValue: 0, cardCount: 0 };

              return (
                <Link key={collezione.id} href={`/collezioni/${collezione.id}`}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>{collezione.nome}</CardTitle>
                      {collezione.descrizione && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{collezione.descrizione}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Carte nella collezione</span>
                          <span className="font-medium">{collezione.carte?.length || 0}</span>
                        </div>
                        {valuation.totalValue > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Valore stimato</span>
                            <span className="font-medium text-green-600">€{valuation.totalValue.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}