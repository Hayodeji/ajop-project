import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { PublicRepo } from './public.repo'
import { PublicGroupResponse } from './public.schema'

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name)

  constructor(private readonly publicRepo: PublicRepo) {}

  async getGroupByToken(token: string): Promise<PublicGroupResponse> {
    let group: any
    try {
      group = await this.publicRepo.findGroupByToken(token)
    } catch (error) {
      this.logger.error(`Fetch public group failed: ${error.message}`)
      throw new NotFoundException('Group not found')
    }

    if (!group) throw new NotFoundException('Group not found')

    try {
      const members = await this.publicRepo.findMembersByGroup(group.id)
      const contributions = await this.publicRepo.findContributionsByGroup(group.id, group.current_cycle)

      const anonymisedMembers = members.map(m => {
        let anonPhone = ''
        if (m.phone && m.phone.length >= 8) {
          anonPhone = m.phone.substring(0, 4) + '****' + m.phone.substring(m.phone.length - 4)
        }
        return {
          ...m,
          phone: anonPhone
        }
      })

      return { 
        group, 
        members: anonymisedMembers as any, 
        contributions: contributions as any 
      }
    } catch (error) {
      this.logger.error(`Fetch public details failed: ${error.message}`)
      throw new NotFoundException('Could not load group details.')
    }
  }
}
