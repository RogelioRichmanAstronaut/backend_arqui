export type PaymentState = 'PENDIENTE' | 'APROBADA' | 'DENEGADA' | 'CANCELADA';

export class PaymentAttemptEntity {
  constructor(
    public readonly id: string,
    public readonly reservationId: string,   // PK Reservation
    public readonly currency: string,
    public readonly totalAmount: number,
    public readonly returnUrl: string,
    public readonly callbackUrl: string,
    public state: PaymentState,
    public paymentAttemptExtId?: string | null,
    public idempotencyKey?: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static fromPrisma(r: any): PaymentAttemptEntity {
    return new PaymentAttemptEntity(
      r.id, r.reservationId, r.currency, Number(r.totalAmount),
      r.returnUrl, r.callbackUrl, r.state, r.paymentAttemptExtId, r.idempotencyKey,
      r.createdAt, r.updatedAt,
    );
  }
}

export class TransactionEntity {
  constructor(
    public readonly id: string,
    public readonly transactionId: string,
    public readonly paymentAttemptId: string,
    public state: PaymentState,
    public authCode?: string | null,
    public receiptRef?: string | null,
    public readonly totalAmount?: number,
    public readonly currency?: string,
    public readonly transactionAt?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static fromPrisma(r: any): TransactionEntity {
    return new TransactionEntity(
      r.id, r.transactionId, r.paymentAttemptId, r.state, r.authCode, r.receiptRef,
      Number(r.totalAmount), r.currency, r.transactionAt, r.createdAt, r.updatedAt,
    );
  }
}