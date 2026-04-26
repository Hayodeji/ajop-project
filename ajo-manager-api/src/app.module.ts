import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { validateEnv } from './config/env.validation'
import { SupabaseModule } from './supabase/supabase.module'
import { AuthModule } from './auth/auth.module'
import { GroupsModule } from './groups/groups.module'
import { SubscriptionsModule } from './subscriptions/subscriptions.module'
import { MembersModule } from './members/members.module'
import { ContributionsModule } from './contributions/contributions.module'
import { PayoutsModule } from './payouts/payouts.module'
import { PublicModule } from './public/public.module'
import { RemindersModule } from './reminders/reminders.module'
import { WebhookModule } from './webhook/webhook.module'
import { AdminModule } from './admin/admin.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    SupabaseModule,
    AuthModule,
    GroupsModule,
    SubscriptionsModule,
    MembersModule,
    ContributionsModule,
    PayoutsModule,
    PublicModule,
    RemindersModule,
    WebhookModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
