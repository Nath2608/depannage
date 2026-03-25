import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '@services/socket';

interface ProfessionalLocation {
  latitude: number;
  longitude: number;
  updatedAt: Date;
}

interface UseJobTrackingOptions {
  jobId: string;
  onStatusChange?: (status: string) => void;
  onLocationUpdate?: (location: ProfessionalLocation) => void;
}

export function useJobTracking({
  jobId,
  onStatusChange,
  onLocationUpdate,
}: UseJobTrackingOptions) {
  const queryClient = useQueryClient();
  const [professionalLocation, setProfessionalLocation] = useState<ProfessionalLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to socket and subscribe to job updates
    socketService.connect();
    socketService.subscribeToJob(jobId);
    setIsConnected(true);

    // Listen for professional location updates
    const unsubscribeLocation = socketService.onProfessionalLocation((data) => {
      if (data.jobId === jobId) {
        const location = {
          latitude: data.latitude,
          longitude: data.longitude,
          updatedAt: new Date(),
        };
        setProfessionalLocation(location);
        onLocationUpdate?.(location);
      }
    });

    // Listen for job status updates
    const unsubscribeStatus = socketService.onJobStatusUpdate((data) => {
      if (data.jobId === jobId) {
        // Invalidate job query to refetch fresh data
        queryClient.invalidateQueries({ queryKey: ['job', jobId] });
        onStatusChange?.(data.status);
      }
    });

    return () => {
      unsubscribeLocation();
      unsubscribeStatus();
      socketService.unsubscribeFromJob(jobId);
      setIsConnected(false);
    };
  }, [jobId, queryClient, onStatusChange, onLocationUpdate]);

  const refreshLocation = useCallback(() => {
    socketService.emit('request:professional_location', { jobId });
  }, [jobId]);

  return {
    professionalLocation,
    isConnected,
    refreshLocation,
  };
}

export default useJobTracking;
