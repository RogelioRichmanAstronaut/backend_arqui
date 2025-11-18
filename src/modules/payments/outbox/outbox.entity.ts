export type OutboxEvent = {
    id: string;
    aggregateType: 'Reservation' | 'Payment';
    aggregateId: string;
    type: string;                 // PaymentAttemptCreated | PaymentApproved | PaymentDenied | RefundCreated
    payload: Record<string, any>; // JSON
    createdAt: Date;
    publishedAt?: Date | null;
  };