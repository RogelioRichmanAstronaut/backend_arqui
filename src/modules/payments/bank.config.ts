export type BankConfig = {
    baseUrl: string;
    apiKey: string;
    webhookSecret: string;
    timeoutMs: number;
    webhookCallbackUrl: string;
  };
  
  export const bankConfig = (): BankConfig => {
    const baseUrl = process.env.BANK_BASE_URL ?? '';
    const apiKey = process.env.BANK_API_KEY ?? '';
    const webhookSecret = process.env.BANK_WEBHOOK_SECRET ?? '';
    const timeoutMs = Number(process.env.BANK_TIMEOUT_MS ?? '8000');
    const publicBase = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';
  
    if (!baseUrl || !apiKey || !webhookSecret) {
      throw new Error('BANK_* env vars missing (BANK_BASE_URL/BANK_API_KEY/BANK_WEBHOOK_SECRET)');
    }
  
    return {
      baseUrl,
      apiKey,
      webhookSecret,
      timeoutMs,
      webhookCallbackUrl: `${publicBase}/v1/payments/webhook`,
    };
  };