'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type GradedCompany = 'PSA' | 'BGS' | 'CGC';

const COMPANY_LABELS: Record<GradedCompany, string> = {
  PSA: 'PSA',
  BGS: 'BGS',
  CGC: 'CGC',
};

interface GradingInputProps {
  company: GradedCompany | null;
  grade: number | null;
  onCompanyChange: (company: GradedCompany | null) => void;
  onGradeChange: (grade: number | null) => void;
  disabled?: boolean;
}

export function GradingInput({
  company,
  grade,
  onCompanyChange,
  onGradeChange,
  disabled = false,
}: GradingInputProps) {
  const handleGradeChange = (val: string) => {
    const gradeNum = parseInt(val);
    if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 10) return;
    onGradeChange(gradeNum);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grading (Opzionale)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Società di Gradazione</Label>
          <Select value={company || ''} onValueChange={(val) => onCompanyChange(val as GradedCompany || null)} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona una società" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nessuno</SelectItem>
              {(Object.keys(COMPANY_LABELS) as GradedCompany[]).map((c) => (
                <SelectItem key={c} value={c}>{COMPANY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Grado ({company && `per ${company}`})</Label>
          <Select
            value={grade?.toString() || ''}
            onValueChange={handleGradeChange}
            disabled={disabled || !company}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Grado 1-10`} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((g) => (
                <SelectItem key={g} value={g.toString()}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}