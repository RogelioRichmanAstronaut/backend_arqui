export interface InitiatePaymentParams {
    reservationId: string;   // business id de Reservation
    clientId: string;        // <TIPO>-<NUMERO>
    clientName?: string;     // Nombre del cliente
    currency: string;        // ISO-4217
    totalAmount: number;
    description: string;
    returnUrl: string;
    callbackUrl: string;
    idempotencyKey?: string;
  }
  export interface InitiatePaymentResult {
    paymentAttemptExtId: string;
    bankPaymentUrl: string;
    initialState: 'PENDIENTE';
    expiresAt: string;
  }
  
  export interface PaymentStatusParams {
    transactionId?: string;
    paymentAttemptExtId?: string;
  }
  export interface PaymentStatusResult {
    state: 'PENDIENTE' | 'APROBADA' | 'DENEGADA' | 'CANCELADA';
    stateDetail?: string;
    totalAmount: number;
    currency: string;
    authCode?: string;
    receiptRef?: string;
    lastUpdateAt: string;
  }
  
  export interface RefundParams {
    transactionId: string;
    amount: number;
  }
  export interface RefundResult {
    refundId: string;
    refundState: 'PENDIENTE' | 'APROBADA' | 'DENEGADA' | 'CANCELADA';
    receiptRef?: string;
    refundedAt: string;
  }
  
  export interface ValidateReceiptParams {
    transactionId: string;
    expectedAmount: number;
  }
  export interface ValidateReceiptResult {
    valid: boolean;
    detail: string;
  }
  
  export interface BankPort {
    initiatePayment(p: InitiatePaymentParams): Promise<InitiatePaymentResult>;
    getStatus(p: PaymentStatusParams): Promise<PaymentStatusResult>;
    refund(p: RefundParams): Promise<RefundResult>;
    validateReceipt(p: ValidateReceiptParams): Promise<ValidateReceiptResult>;
  }