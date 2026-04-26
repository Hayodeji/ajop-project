import { Controller, Get, Param } from '@nestjs/common'
import { PublicService } from './public.service'

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get(':token')
  getGroup(@Param('token') token: string) {
    return this.publicService.getGroupByToken(token)
  }
}
