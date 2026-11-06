'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, X, Check, RefreshCw } from 'lucide-react';
import { uploadScanImage, getScanStatus } from '@/lib/api';
import { useScanSocket } from '@/hooks/use-scan-socket';
import type { Scansione, Carta } from '@/types';

interface MatchCardProps {
  scansione: Scansione & { matchedCard: Carta | null };
  onConfirm: () => void;
  onReject: () => void;
  onRepeat: () => void;
}

function MatchCard({ scansione, onConfirm, onReject, onRepeat }: MatchCardProps) {
  const matchedCard = scansione.matchedCard;

  if (!matchedCard) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" strokeWidth={2} />
        <p className="text-gray-600 mb-4">Nessuna corrispondenza trovata</p>
        <Button variant="outline" onClick={onRepeat}>
          <RefreshCw className="w-4 h-4 mr-2" strokeWidth={2} />
          Prova di nuovo
        </Button>
      </div>
    );
  }

  const rarityColors: Record<string, string> = {
    'Common': 'bg-gray-100 text-gray-700',
    'Uncommon': 'bg-green-100 text-green-700',
    'Rare': 'bg-blue-100 text-blue-700',
    'Rare Holo': 'bg-purple-100 text-purple-700',
    'Promo': 'bg-yellow-100 text-yellow-700',
  };

  const similarityScore = Math.round((scansione.confidence || 0) * 100);

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Corrispondenza trovata!</h3>
        <p className="text-sm text-gray-500">Punteggio di somiglianza: {similarityScore}%</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <img
            src={scansione.originalUrl || matchedCard.image_url || '/placeholder-card.png'}
            alt="Carta scansionata"
            className="w-full max-h-[400px] object-contain bg-gray-50 rounded-lg"
          />
        </div>

        <div>
          <h4 className="text-xl font-bold mb-2">{matchedCard.name}</h4>
          <p className="text-sm text-gray-500 mb-2">
            #{matchedCard.number} • {matchedCard.set?.name || 'Set sconosciuto'}
          </p>

          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-1 text-xs rounded ${rarityColors[matchedCard.rarity || 'Common'] || rarityColors['Common']}`}>
              {matchedCard.rarity}
            </span>
            {matchedCard.types && matchedCard.types.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {matchedCard.types.map((type) => (
                  <span key={type} className="px-2 py-1 text-xs border rounded">
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>

          {matchedCard.hp && (
            <p className="text-sm mb-2">
              <span className="text-gray-600">HP:</span>
              <span className="ml-2 font-bold">{matchedCard.hp}</span>
            </p>
          )}

          {matchedCard.artist && (
            <p className="text-sm text-gray-600 mb-4">Artista: {matchedCard.artist}</p>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onReject}>
              <X className="w-4 h-4 mr-2" />
              Rifiuta
            </Button>
            <Button className="flex-1" onClick={onConfirm}>
              <Check className="w-4 h-4 mr-2" />
              Conferma
            </Button>
          </div>
        </div>
      </div>

      <Button variant="outline" onClick={onRepeat} className="w-full">
        <RefreshCw className="w-4 h-4 mr-2" />
        Riesegui
      </Button>
    </div>
  );
}

export default function ScansionePage() {
  const router = useRouter();
  const [step, setStep] = useState<'home' | 'capturing' | 'processing' | 'result' | 'error'>('home');
  const [scansione, setScansione] = useState<Scansione | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanId, setScanId] = useState<number | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [progress, setProgress] = useState<{ scanId: number; status: string; progress: number }>({ scanId: 0, status: 'pending', progress: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useScanSocket({
    scanId: scanId || 0,
    onProgress: (p) => {
      setProgress(p);
      if (p.status === 'completed') {
        setStep('result');
      } else if (p.status === 'failed') {
        setError('Scansione fallita');
        setStep('error');
      }
    },
    onComplete: (data) => {
      setScansione(data);
      setStep('result');
    },
    onError: (err) => {
      setError(err);
      setStep('error');
    },
  });

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Non è possibile accedere alla fotocamera');
      setStep('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
  }, [videoStream]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const aspectRatio = 3 / 4;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    let frameWidth = videoWidth;
    let frameHeight = videoHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (videoWidth / videoHeight > aspectRatio) {
      frameWidth = videoHeight * aspectRatio;
      offsetX = (videoWidth - frameWidth) / 2;
    } else {
      frameHeight = videoWidth / aspectRatio;
      offsetY = (videoHeight - frameHeight) / 2;
    }

    canvas.width = frameWidth;
    canvas.height = frameHeight;

    ctx?.drawImage(video, offsetX, offsetY, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'scan.jpg', { type: 'image/jpeg', lastModified: Date.now() });
        await handleScan(file);
      }
    }, 'image/jpeg', 0.9);
  }, []);

  const handleScan = async (file: File) => {
    setStep('processing');
    setError(null);
    setProgress({ scanId: 0, status: 'pending', progress: 0 });

    try {
      const response = await uploadScanImage(file);
      const scanId = response.data.id;
      setScanId(scanId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore durante la scansione');
      setStep('error');
    }
  };

  const handleConfirm = () => {
    setStep('home');
    setScansione(null);
    setScanId(null);
  };

  const handleReject = () => {
    setStep('home');
    setScansione(null);
    setScanId(null);
  };

  const handleRepeat = () => {
    setStep('capturing');
  };

  const handleCancel = () => {
    stopCamera();
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Scannerizza una Carta Pokemon</CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'home' && (
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Cattura una foto della tua carta Pokemon e la nostra IA cercherà la corrispondenza nel database.
                </p>
                <Button onClick={() => setStep('capturing')} className="w-full md:w-auto">
                  InviaFoto
                </Button>
              </div>
            )}

            {step === 'capturing' && (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg overflow-hidden"
                    style={{ aspectRatio: '3/4' }}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="absolute top-4 right-4 text-white text-sm bg-black/50 px-2 py-1 rounded">
                    Premi per scattare
                  </div>

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white pointer-events-none">
                    <div className="w-[calc(75%-20px)] h-[calc(75%-20px)]"></div>
                  </div>

                  <Button
                    onClick={capture}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white hover:bg-white/90 rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
                  >
                    📷
                  </Button>

                  <Button
                    onClick={handleCancel}
                    variant="ghost"
                    className="absolute top-2 right-2 text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-center text-sm text-gray-500">
                  Allinea la carta all'interno del reticolo e premi il pulsante per scattare
                </p>
              </div>
            )}

            {step === 'processing' && (
              <div className="text-center py-8">
                <div className="mb-4">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
                </div>
                <p className="text-lg font-medium mb-2">Elaborazione in corso...</p>
                <p className="text-gray-500">
                  Progresso: {progress.progress}%
                </p>
              </div>
            )}

            {step === 'result' && scansione && (
              <MatchCard
                scansione={scansione}
                onConfirm={handleConfirm}
                onReject={handleReject}
                onRepeat={handleRepeat}
              />
            )}

            {step === 'error' && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" strokeWidth={2} />
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="outline" onClick={handleRepeat}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Riprova
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}