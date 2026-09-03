import { Controller, Post, Param, UseGuards, ForbiddenException } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { RemindersService } from './reminders.service'
import { GroupsRepo } from '../groups/groups.repo'

@Controller('reminders')
export class RemindersController {
  constructor(
    private readonly remindersService: RemindersService,
    private readonly groupsRepo: GroupsRepo,
  ) {}

  @Post('group/:groupId')
  @UseGuards(JwtAuthGuard)
  async sendGroupReminders(
    @Param('groupId') groupId: string,
    @CurrentUser() user: any,
  ) {
    const group = await this.groupsRepo.findById(user.id, groupId)
    if (!group) throw new ForbiddenException('Group not found or access denied')

    const result = await this.remindersService.triggerManualGroupReminders(group)
    return { 
      success: true,
      ...result,
    }
  }
}
