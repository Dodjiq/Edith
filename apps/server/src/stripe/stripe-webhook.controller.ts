import {
  Controller,
  Post,
  Headers,
  Body,
  Req,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';

type CheckoutBody = {
  priceId: string;
  userId: string;
  email?: string;
  successUrl?: string;
  cancelUrl?: string;
};

type PortalBody = {
  userId: string;
  returnUrl?: string;
};

@Controller('stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly stripeService: StripeService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    const rawBody: Buffer = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from('');

    try {
      await this.stripeService.handleWebhook({ rawBody, signature });
      return { received: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Webhook handling error: ${message}`);
      throw new BadRequestException(message);
    }
  }

  @Post('checkout')
  async createCheckoutSession(
    @Body() body: CheckoutBody,
  ): Promise<{ url: string }> {
    const { userId, email = '', priceId, successUrl = '', cancelUrl = '' } = body;

    if (!userId || !priceId) {
      throw new BadRequestException('userId and priceId are required');
    }

    this.logger.debug(`POST /stripe/checkout: userId=${userId}`);

    return this.stripeService.createCheckoutSession({
      userId,
      email,
      priceId,
      successUrl,
      cancelUrl,
    });
  }

  @Post('portal')
  async createPortalSession(
    @Body() body: PortalBody,
  ): Promise<{ url: string }> {
    const { userId, returnUrl = '' } = body;

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    this.logger.debug(`POST /stripe/portal: userId=${userId}`);

    return this.stripeService.createCustomerPortalSession({ userId, returnUrl });
  }
}
