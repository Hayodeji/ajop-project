import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WhatsAppService } from './whatsapp.service'
import { ReminderLogEntity } from '../database/entities/reminder-log.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ReminderLogEntity])],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
