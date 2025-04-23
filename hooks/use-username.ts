import { useState, useEffect } from 'react';

export function useUsername(address: string | null) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setUsername(null);
      return;
    }

    const fetchUsername = async () => {
      try {
        const response = await fetch(`/api/user/${address}`);
        const data = await response.json();
        if (data.username !== username) {
          setUsername(data.username);
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    };

    // Initial fetch
    fetchUsername();

    // Set up polling with a shorter interval
    const interval = setInterval(fetchUsername, 1000); // Check every second

    return () => clearInterval(interval);
  }, [address]);

  return username;
}
