import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { MembersService } from './members.service'
import { InviteMemberDto } from './dto/invite-member.dto'
import { SupabaseAuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { User } from '@supabase/supabase-js'

@Controller('groups/:groupId/members')
@UseGuards(SupabaseAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  getMembers(@Param('groupId') groupId: string, @CurrentUser() user: User) {
    return this.membersService.getMembers(groupId, user.id)
  }

  @Post()
  inviteMember(
    @Param('groupId') groupId: string,
    @CurrentUser() user: User,
    @Body() dto: InviteMemberDto,
  ) {
    return this.membersService.inviteMember(groupId, user.id, dto)
  }

  @Patch(':memberId')
  updateMember(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.membersService.updateMember(groupId, memberId, user.id, body)
  }

  @Delete(':memberId')
  removeMember(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: User,
  ) {
    return this.membersService.removeMember(groupId, memberId, user.id)
  }
}
