import { Body, Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common'
import { ContributionsService } from './contributions.service'
import { MarkContributionDto } from './dto/mark-contribution.dto'
import { SupabaseAuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { User } from '@supabase/supabase-js'

@Controller('groups/:groupId/contributions')
@UseGuards(SupabaseAuthGuard)
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Get()
  getContributions(
    @Param('groupId') groupId: string,
    @CurrentUser() user: User,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.contributionsService.getContributions(groupId, user.id, from, to)
  }

  @Post()
  markContribution(
    @Param('groupId') groupId: string,
    @CurrentUser() user: User,
    @Body() dto: MarkContributionDto,
  ) {
    return this.contributionsService.markContribution(groupId, user.id, dto)
  }
}
