import axios, { AxiosInstance } from 'axios';
import { bankConfig } from '../bank.config';
import {
  BankPort,
  InitiatePaymentParams, InitiatePaymentResult,
  PaymentStatusParams, PaymentStatusResult,
  RefundParams, RefundResult,
  ValidateReceiptParams, ValidateReceiptResult
} from '../ports/bank.port';

export class BankHttpAdapter implements BankPort {
  private http: AxiosInstance;
  private cfg = bankConfig();

  constructor() {
    this.http = axios.create({
      baseURL: this.cfg.baseUrl,
      timeout: this.cfg.timeoutMs,
      headers: { 'x-api-key': this.cfg.apiKey },
    });
  }

  async initiatePayment(p: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const body = {
      monto_total: p.totalAmount,
      descripcion_pago: p.description,
      cedula_cliente: p.clientId,
      nombre_cliente: p.clientName || 'Cliente',
      url_respuesta: p.returnUrl,
      url_notificacion: p.callbackUrl,
      destinatario: 'Agencia de Viajes',
    };
    const headers: Record<string, string> = {};
    if (p.idempotencyKey) headers['Idempotency-Key'] = p.idempotencyKey;

    const { data } = await this.http.post('/crear-pago', body, { headers });
    return {
      paymentAttemptExtId: data?.id_pago,
      bankPaymentUrl: data?.url_pago,
      initialState: 'PENDIENTE',
      expiresAt: data?.fecha_expiracion,
    };
  }

  async getStatus(p: PaymentStatusParams): Promise<PaymentStatusResult> {
    const params: any = {};
    if (p.transactionId) params.id_transaccion = p.transactionId;
    if (p.paymentAttemptExtId) params.id_pago = p.paymentAttemptExtId;

    const { data } = await this.http.get('/pagos/estado', { params });
    return {
      state: String(data?.estado ?? 'PENDIENTE').toUpperCase() as any,
      stateDetail: data?.detalle,
      totalAmount: Number(data?.monto ?? 0),
      currency: data?.moneda || 'COP',
      authCode: data?.codigo_autorizacion,
      receiptRef: data?.comprobante,
      lastUpdateAt: data?.fecha_actualizacion,
    };
  }

  async refund(p: RefundParams): Promise<RefundResult> {
    const { data } = await this.http.post('/pagos/reembolso', {
      id_transaccion: p.transactionId,
      monto: p.amount,
    });
    return {
      refundId: data?.id_reembolso,
      refundState: String(data?.estado ?? 'PENDIENTE').toUpperCase() as any,
      receiptRef: data?.comprobante,
      refundedAt: data?.fecha,
    };
  }

  async validateReceipt(p: ValidateReceiptParams): Promise<ValidateReceiptResult> {
    const { data } = await this.http.post('/pagos/comprobante/validar', {
      id_transaccion: p.transactionId,
      monto_esperado: p.expectedAmount,
    });
    return { valid: String(data?.valido).toUpperCase() === 'SI', detail: data?.detalle ?? '' };
  }
}