import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { SuperAdminGuard } from '../common/guards/super-admin.guard'

@Controller('admin')
@UseGuards(SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats()
  }

  @Get('users')
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(Number(page), Number(limit), search)
  }

  @Get('users/:userId')
  getUserDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId)
  }

  @Patch('users/:userId')
  updateUser(@Param('userId') userId: string, @Body() body: { role?: string; plan?: string }) {
    return this.adminService.updateUser(userId, body)
  }

  @Get('groups')
  getGroups(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.getGroups(Number(page), Number(limit), search)
  }

  @Get('groups/:groupId')
  getGroupDetail(@Param('groupId') groupId: string) {
    return this.adminService.getGroupDetail(groupId)
  }

  @Get('subscriptions')
  getSubscriptions(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.getSubscriptions(Number(page), Number(limit))
  }

  @Get('activity')
  getActivity(@Query('limit') limit = '50') {
    return this.adminService.getActivity(Number(limit))
  }
}
