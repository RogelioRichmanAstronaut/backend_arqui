export type AirlineConfig = {
    baseUrl: string;
    apiKey: string;
    timeoutMs: number;
  };
  
  const sanitizeBaseUrl = (u: string) => u.replace(/\/+$/, '');
  
  export const airlineConfig = (): AirlineConfig => {
    const baseUrl =
      process.env.AIRLINE_BASE_URL ??
      process.env.AIR_BASE_URL ??
      '';
    const apiKey =
      process.env.AIRLINE_API_KEY ??
      process.env.AIR_API_KEY ??
      '';
    const timeoutRaw =
      process.env.AIRLINE_TIMEOUT_MS ??
      process.env.AIR_TIMEOUT_MS ??
      '8000';
  
    if (!baseUrl || !apiKey) {
      throw new Error(
        'AIRLINE_* env vars missing: set AIRLINE_BASE_URL and AIRLINE_API_KEY (aliases: AIR_BASE_URL, AIR_API_KEY)',
      );
    }
  
    const timeoutMs = Number.isFinite(Number(timeoutRaw)) ? Number(timeoutRaw) : 8000;
  
    return {
      baseUrl: sanitizeBaseUrl(baseUrl),
      apiKey,
      timeoutMs,
    };
  };