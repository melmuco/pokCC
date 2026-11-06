import { useState, useEffect, useCallback } from 'react';
import { connectScanSocket, disconnectScanSocket, ScanProgress } from '@/lib/api';

interface UseScanSocketProps {
  scanId: number;
  onProgress?: (progress: ScanProgress) => void;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

export const useScanSocket = ({
  scanId,
  onProgress,
  onComplete,
  onError,
}: UseScanSocketProps) => {
  const [progress, setProgress] = useState<ScanProgress>({
    scanId,
    status: 'pending',
    progress: 0,
  });

  const [isConnected, setIsConnected] = useState(false);

  const updateProgress = useCallback((newProgress: ScanProgress) => {
    setProgress(newProgress);
    onProgress?.(newProgress);
  }, [onProgress]);

  useEffect(() => {
    if (!scanId) return;

    const socket = connectScanSocket(
      scanId,
      updateProgress,
      (data) => {
        setProgress({ scanId, status: 'completed', progress: 100 });
        onComplete?.(data);
      },
      (error) => {
        setProgress({ scanId, status: 'failed', progress: 0 });
        onError?.(error);
      },
    );

    setIsConnected(true);

    return () => {
      disconnectScanSocket();
      setIsConnected(false);
    };
  }, [scanId, onProgress, onComplete, onError]);

  return {
    progress,
    isConnected,
  };
};