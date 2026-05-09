import { Module } from '@nestjs/common'
import { PublicService } from './public.service'
import { PublicResolver } from './public.resolver'
import { PublicRepo } from './public.repo'

@Module({
  providers: [PublicService, PublicResolver, PublicRepo],
})
export class PublicModule {}
