import { useEffect, useState } from 'react';
import { socketService } from '../services/socket';

export const useRealtime = () => {
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    socketService.connect();
    const unsubscribe = socketService.addListener((event) => {
      setLastEvent(event);
    });

    return unsubscribe;
  }, []);

  return lastEvent;
};
