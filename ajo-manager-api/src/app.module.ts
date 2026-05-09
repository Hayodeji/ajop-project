import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { join } from 'path'
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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req }: { req: any }) => ({ req }),
      path: '/api/graphql', // Mounting it under /api/graphql for consistency
    }),
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
