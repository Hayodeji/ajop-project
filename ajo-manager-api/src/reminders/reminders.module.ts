import { Module } from '@nestjs/common'
import { RemindersService } from './reminders.service'
import { RemindersRepo } from './reminders.repo'
import { RemindersController } from './reminders.controller'
import { GroupsModule } from '../groups/groups.module'
import { SupabaseModule } from '../supabase/supabase.module'

@Module({
  imports: [GroupsModule, SupabaseModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersRepo],
  exports: [RemindersService],
})
export class RemindersModule {}
