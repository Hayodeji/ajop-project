import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PublicService } from './public.service'
import { PublicResolver } from './public.resolver'
import { PublicRepo } from './public.repo'
import { GroupEntity } from '../database/entities/group.entity'
import { GroupMemberEntity } from '../database/entities/group-member.entity'
import { ContributionEntity } from '../database/entities/contribution.entity'

@Module({
  imports: [TypeOrmModule.forFeature([GroupEntity, GroupMemberEntity, ContributionEntity])],
  providers: [PublicService, PublicResolver, PublicRepo],
})
export class PublicModule {}
