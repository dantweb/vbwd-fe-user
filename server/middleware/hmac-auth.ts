import { createHmac, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const TIMESTAMP_WINDOW_SECONDS = 30;

export function createHmacAuth(secret: string) {
  return function hmacAuth(req: Request, res: Response, next: NextFunction): void {
    const timestamp = req.headers['x-plugin-timestamp'] as string | undefined;
    const signature = req.headers['x-plugin-signature'] as string | undefined;

    if (!timestamp || !signature) {
      res.status(401).json({ error: 'Missing authentication headers' });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);

    if (isNaN(requestTime) || Math.abs(now - requestTime) > TIMESTAMP_WINDOW_SECONDS) {
      res.status(401).json({ error: 'Request expired' });
      return;
    }

    const body = (req.body && Object.keys(req.body).length > 0) ? JSON.stringify(req.body) : '';
    const message = `${req.method}:${req.path}:${timestamp}:${body}`;
    const expectedSignature = createHmac('sha256', secret).update(message).digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      console.warn(`[HMAC] Invalid signature from ${req.ip} for ${req.method} ${req.path}`);
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    next();
  };
}
