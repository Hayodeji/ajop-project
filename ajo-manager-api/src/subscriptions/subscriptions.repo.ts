import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SubscriptionEntity } from '../database/entities/subscription.entity'

@Injectable()
export class SubscriptionsRepo {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionsRepo: Repository<SubscriptionEntity>,
  ) {}

  async findByUserId(userId: string) {
    return this.subscriptionsRepo.findOne({ where: { userId } })
  }

  async update(userId: string, updates: any) {
    await this.subscriptionsRepo.update({ userId }, updates)
    return this.subscriptionsRepo.findOne({ where: { userId } })
  }

  async upsert(subscription: any) {
    // repository.save will perform insert or update based on primary/unique keys
    const entity = this.subscriptionsRepo.create({
      userId: subscription.user_id || subscription.userId,
      plan: subscription.plan,
      status: subscription.status,
      trialEndsAt: subscription.trial_ends_at || subscription.trialEndsAt,
      currentPeriodStart: subscription.current_period_start || subscription.currentPeriodStart,
      currentPeriodEnd: subscription.current_period_end || subscription.currentPeriodEnd,
      paystackReference: subscription.paystack_reference || subscription.paystackReference,
    })
    return this.subscriptionsRepo.save(entity)
  }
}
