'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConditionSelector, CONDITION_MULTIPLIERS } from '@/components/grading/ConditionSelector';
import { GradingInput } from '@/components/grading/GradingInput';
import { ArrowLeft, Save, Calculator } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

type Condition = 'NearMint' | 'LightPlay' | 'Play' | 'Moderate' | 'Heavy' | 'Damaged';
type GradedCompany = 'PSA' | 'BGS' | 'CGC';

interface CardDetail {
  id: number;
  name: string;
  basePrice: number;
  rarity: string;
  set: { name: string } | null;
}

interface CollectionCard {
  id: number;
  card_id: number;
  carta: CardDetail;
  condition: Condition | null;
  graded_company: GradedCompany | null;
  graded_grade: number | null;
  quantity: number;
}

const RARITY_MULTIPLIERS: Record<string, number> = {
  'Common': 1,
  'Uncommon': 1.5,
  'Rare': 2,
  'Rare Holo': 3,
  'Rare V': 3.5,
  'Rare VMAX': 4,
  'Ultra Rare': 5,
  'Legend': 8,
  'Promo': 1.2,
};

const GRADE_MULTIPLIERS: Record<string, Record<number, number>> = {
  PSA: { 10: 5, 9: 3, 8: 2, 7: 1.5, 6: 1.2 },
  BGS: { 10: 4.5, 9: 2.5, 8: 1.8, 7: 1.3, 6: 1.1 },
  CGC: { 10: 4, 9: 2.5, 8: 1.5, 7: 1.1, 6: 1 },
};

async function getCard(id: string): Promise<CardDetail | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cards/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch {
    return null;
  }
}

async function getCollectionCards(collectionId: number): Promise<CollectionCard[]> {
  const token = localStorage.getItem('token');
  if (!token) return [];

  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/collections/${collectionId}/cards`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch {
    return [];
  }
}

export default function CardGradingPage() {
  const params = useParams();
  const router = useRouter();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | string[]>(params.id);

  const [condition, setCondition] = useState<Condition | null>(null);
  const [gradedCompany, setGradedCompany] = useState<GradedCompany | null>(null);
  const [gradedGrade, setGradedGrade] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const rarityMultiplier = card ? (RARITY_MULTIPLIERS[card.rarity] || 1) : 1;
  const conditionMultiplier = condition ? CONDITION_MULTIPLIERS[condition] : 1;
  const gradeMultiplier = gradedCompany && gradedGrade
    ? (GRADE_MULTIPLIERS[gradedCompany]?.[gradedGrade] || 1)
    : 1;
  const finalMultiplier = rarityMultiplier * gradeMultiplier * conditionMultiplier;
  const finalPrice = card?.basePrice ? card.basePrice * finalMultiplier : 0;

  useEffect(() => {
    async function loadData() {
      const cardId = Array.isArray(selectedCardId) ? selectedCardId[0] : selectedCardId;
      const cardData = await getCard(cardId);
      setCard(cardData);

      const collectionCards = await getCollectionCards(1);
      setCollectionCards(collectionCards);

      const collectionCard = collectionCards.find(c => c.card_id === parseInt(cardId));
      if (collectionCard) {
        setCondition(collectionCard.condition);
        setGradedCompany(collectionCard.graded_company);
        setGradedGrade(collectionCard.graded_grade);
      }

      setLoading(false);
    }

    loadData();
  }, [selectedCardId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Carta non trovata</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Valutazione della Carta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold">{card.name}</h2>
                  <p className="text-gray-500">
                    #{card.id} • {card.rarity}
                  </p>
                  <p className="text-gray-500">{card.set?.name || 'Unknown Set'}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-blue-600">Prezzo Base</p>
                  <p className="text-2xl font-bold">€{card.basePrice?.toFixed(2) || '0.00'}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Calculator className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-green-600">Prezzo Finale</p>
                  <p className="text-3xl font-bold text-green-700">€{finalPrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    x{finalMultiplier.toFixed(2)} (rarity x condition x grade)
                  </p>
                </div>

                <Button className="w-full" onClick={() => {
                  const cardId = typeof selectedCardId === 'string' ? selectedCardId : selectedCardId[0];
                  const collectionId = 1;
                  const token = localStorage.getItem('token');

                  axios.patch(
                    `${process.env.NEXT_PUBLIC_API_URL}/cards/${cardId}/grading/collection/${collectionId}`,
                    {
                      condition,
                      graded_company: gradedCompany,
                      graded_grade: gradedGrade,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                  )
                    .then(() => {
                      toast.success('Grading aggiornato!');
                      router.refresh();
                    })
                    .catch((err) => {
                      toast.error('Errore nell\'aggiornare: ' + (err.response?.data?.message || err.message));
                    });
                }}>
                  <Save className="w-4 h-4 mr-2" />
                  Salva Grading
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <ConditionSelector
              value={condition}
              onChange={setCondition}
            />

            <GradingInput
              company={gradedCompany}
              grade={gradedGrade}
              onCompanyChange={setGradedCompany}
              onGradeChange={setGradedGrade}
            />
          </div>
        </div>
      </div>
    </div>
  );
}