import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import type { User } from '@supabase/supabase-js'
import { SupabaseAuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupDto } from './dto/update-group.dto'
import { GroupsService } from './groups.service'

@Controller('groups')
@UseGuards(SupabaseAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.id, dto)
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.groupsService.findAllForAdmin(user.id)
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.groupsService.findOne(user.id, id)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(user.id, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.groupsService.remove(user.id, id)
  }
}
