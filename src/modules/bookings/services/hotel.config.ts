export type HotelConfig = {
    baseUrl: string;
    apiKey: string;
    timeoutMs: number;
  };
  
  const sanitizeBaseUrl = (u: string) => u.replace(/\/+$/, '');
  
  export const hotelConfig = (): HotelConfig => {
    const baseUrl = process.env.HOTEL_BASE_URL ?? '';
    const apiKey = process.env.HOTEL_API_KEY ?? '';
    const timeoutRaw = process.env.HOTEL_TIMEOUT_MS ?? '8000';
  
    if (!baseUrl || !apiKey) {
      throw new Error(
        'HOTEL_* env vars missing: set HOTEL_BASE_URL and HOTEL_API_KEY',
      );
    }
  
    const timeoutMs = Number.isFinite(Number(timeoutRaw)) ? Number(timeoutRaw) : 8000;
  
    return {
      baseUrl: sanitizeBaseUrl(baseUrl),
      apiKey,
      timeoutMs,
    };
  };