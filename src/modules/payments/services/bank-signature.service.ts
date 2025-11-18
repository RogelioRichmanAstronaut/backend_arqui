import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { bankConfig } from '../bank.config';

@Injectable()
export class BankSignatureService {
  private secret = bankConfig().webhookSecret;

  verify(signatureHeader: string | undefined, rawBody: string) {
    if (!signatureHeader) throw new UnauthorizedException('Missing signature');
    const expected = crypto.createHmac('sha256', this.secret).update(rawBody, 'utf8').digest('hex');
    const a = Buffer.from(signatureHeader, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid signature');
    }
  }
}