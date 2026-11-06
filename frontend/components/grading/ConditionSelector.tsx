'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type Condition = 'NearMint' | 'LightPlay' | 'Play' | 'Moderate' | 'Heavy' | 'Damaged';

const CONDITION_LABELS: Record<Condition, string> = {
  NearMint: 'Near Mint (NM-M)',
  LightPlay: 'Light Play (LP-',
  Play: 'Played (MP)',
  Moderate: 'Moderate (PD)',
  Heavy: 'Heavy (HP)',
  Damaged: 'Damaged (DM)',
};

const CONDITION_MULTIPLIERS: Record<Condition, number> = {
  NearMint: 1.0,
  LightPlay: 0.7,
  Play: 0.5,
  Moderate: 0.3,
  Heavy: 0.2,
  Damaged: 0.1,
};

interface ConditionSelectorProps {
  value: Condition | null;
  onChange: (value: Condition | null) => void;
  disabled?: boolean;
}

export function ConditionSelector({ value, onChange, disabled = false }: ConditionSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Condizione della Carta</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={value || ''}
          onValueChange={(val) => onChange(val as Condition || null)}
          disabled={disabled}
        >
          <div className="space-y-4">
            {(Object.keys(CONDITION_LABELS) as Condition[]).map((condition) => (
              <div key={condition} className="flex items-center space-x-3">
                <RadioGroupItem value={condition} id={`condition-${condition}`} />
                <Label htmlFor={`condition-${condition}`} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span>{CONDITION_LABELS[condition]}</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      x{CONDITION_MULTIPLIERS[condition]}
                    </span>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

export { CONDITION_MULTIPLIERS };