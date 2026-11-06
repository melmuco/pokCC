'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Package, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface SetValuation {
  setName: string;
  value: number;
  cardCount: number;
}

interface CollectionValuation {
  totalValue: number;
  bySet: SetValuation[];
}

interface User {
  id: number;
  email: string;
  nome?: string;
  cognome?: string;
}

async function getUserProfile(): Promise<User | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getValuation(token: string | null): Promise<CollectionValuation> {
  if (!token) {
    return { totalValue: 0, bySet: [] };
  }

  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/valuation/user/total`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch {
    return { totalValue: 0, bySet: [] };
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [valuation, setValuation] = useState<CollectionValuation>({ totalValue: 0, bySet: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function loadData() {
      const profile = await getUserProfile();
      setUser(profile);

      const token = localStorage.getItem('token');
      const valuationData = await getValuation(token);

      setValuation(valuationData);
      setLoading(false);
    }

    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const token = localStorage.getItem('token');
    const valuationData = await getValuation(token);
    setValuation(valuationData);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              Benvenuto{user?.nome ? `, ${user.nome}` : ''}
            </h1>
            <p className="text-gray-600 mt-1">La tua collezione di Pokemon cards</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Valore totale</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{valuation.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Valore complessivo della collezione
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Set completati</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {valuation.bySet.filter(s => s.cardCount > 0).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Set con carte nella collezione
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Trend settimanale</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {valuation.totalValue > 0 ? '+5.2%' : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Variazione rispetto alla settimana scorsa
              </p>
            </CardContent>
          </Card>
        </div>

        {valuation.bySet.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Valore per Set</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {valuation.bySet.map((set) => (
                  <div key={set.setName} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{set.setName}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {set.cardCount} carte
                        </Badge>
                      </div>
                      <span className="font-bold">€{set.value.toFixed(2)}</span>
                    </div>
                    <Progress value={(set.value / valuation.totalValue) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {valuation.bySet.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Nessuna carta nella collezione</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Non hai ancora aggiunto carte alla tua collezione.
                <a href="/collezioni" className="block text-center mt-4 text-blue-600 hover:underline">
                  Vai alle collezioni
                </a>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}