import { Module } from '@nestjs/common'
import { RemindersService } from './reminders.service'
import { RemindersRepo } from './reminders.repo'

@Module({
  providers: [RemindersService, RemindersRepo],
  exports: [RemindersService],
})
export class RemindersModule {}
