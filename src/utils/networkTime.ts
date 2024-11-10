export async function fetchNetworkTime(): Promise<Date> {
  const timeApis = [
    'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
    'https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=zone&zone=UTC',
    'https://showcase.api.linx.twenty57.net/UnixTime/tounix',
    'https://currentmillis.com/time/minutes-since-unix-epoch.php'
  ];

  for (const api of timeApis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sekunder timeout

      const response = await fetch(api, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response?.ok) {
        const data = await response.json();
        
        // Håndter forskellige API response formater
        if (data.datetime) return new Date(data.datetime);
        if (data.dateTime) return new Date(data.dateTime);
        if (data.formatted) return new Date(data.formatted);
        if (data.timestamp) return new Date(data.timestamp * 1000);
        if (typeof data === 'number') return new Date(data * 1000);
      }
    } catch (error) {
      console.warn(`Failed to fetch time from ${api}`);
      continue; // Prøv næste API
    }
  }

  // Hvis alle API'er fejler, brug lokal tid
  console.warn('All time APIs failed - using local time');
  return new Date();
} 