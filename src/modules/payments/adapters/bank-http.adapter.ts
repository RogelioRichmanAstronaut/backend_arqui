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
      identificador_paquete: p.reservationId,
      identificador_cliente: p.clientId,
      moneda: p.currency,
      monto_total: p.totalAmount,
      descripcion: p.description,
      retorno_url: p.returnUrl,
      callback_url: p.callbackUrl,
    };
    const headers: Record<string, string> = {};
    if (p.idempotencyKey) headers['Idempotency-Key'] = p.idempotencyKey;

    const { data } = await this.http.post('/pagos/iniciar', body, { headers });
    return {
      paymentAttemptExtId: data?.identificador_intento_pago,
      bankPaymentUrl: data?.url_pago_banco,
      initialState: 'PENDIENTE',
      expiresAt: data?.fecha_expiracion,
    };
  }

  async getStatus(p: PaymentStatusParams): Promise<PaymentStatusResult> {
    const params: any = {};
    if (p.transactionId) params.identificador_transaccion_banco = p.transactionId;
    if (p.paymentAttemptExtId) params.identificador_intento_pago = p.paymentAttemptExtId;

    const { data } = await this.http.get('/pagos/estado', { params });
    return {
      state: String(data?.estado_actual ?? 'PENDIENTE').toUpperCase() as any,
      stateDetail: data?.detalle_estado,
      totalAmount: Number(data?.monto_total ?? 0),
      currency: data?.moneda,
      authCode: data?.codigo_autorizacion,
      receiptRef: data?.comprobante_url_o_hash,
      lastUpdateAt: data?.fecha_ultimo_cambio,
    };
  }

  async refund(p: RefundParams): Promise<RefundResult> {
    const { data } = await this.http.post('/pagos/reembolso', {
      identificador_transaccion_banco: p.transactionId,
      monto_reembolso: p.amount,
    });
    return {
      refundId: data?.identificador_reembolso,
      refundState: String(data?.estado_reembolso ?? 'PENDIENTE').toUpperCase() as any,
      receiptRef: data?.comprobante_url_o_hash,
      refundedAt: data?.fecha_reembolso,
    };
  }

  async validateReceipt(p: ValidateReceiptParams): Promise<ValidateReceiptResult> {
    const { data } = await this.http.post('/pagos/comprobante/validar', {
      identificador_transaccion_banco: p.transactionId,
      monto_esperado: p.expectedAmount,
    });
    return { valid: String(data?.valido).toUpperCase() === 'SI', detail: data?.detalle_validacion ?? '' };
  }
}