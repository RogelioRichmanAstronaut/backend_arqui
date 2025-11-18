export class RefundEntity {
    constructor(
      public readonly id: string,
      public readonly refundId: string,
      public readonly transactionId: string,
      public readonly amount: number,
      public readonly state: 'PENDIENTE' | 'APROBADA' | 'DENEGADA' | 'CANCELADA',
      public readonly refundedAt: Date,
      public readonly createdAt?: Date,
    ) {}
  
    static fromPrisma(r: any): RefundEntity {
      return new RefundEntity(
        r.id, r.refundId, r.transactionId, Number(r.amount), r.state, r.refundedAt, r.createdAt,
      );
    }
  }