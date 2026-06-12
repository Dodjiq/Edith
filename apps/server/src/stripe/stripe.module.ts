import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({ controllers: [StripeWebhookController], providers: [StripeService] })
export class StripeModule {}
