import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProfileEntity } from '../database/entities/profile.entity'

@Injectable()
export class AuthRepo {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
  ) {}

  async findProfileByUserId(userId: string) {
    return this.profileRepo.findOne({ where: { userId } })
  }

  async findProfileByPhone(phone: string) {
    return this.profileRepo.findOne({ where: { phone }, select: { id: true } })
  }

  async findByReferralCode(code: string) {
    return this.profileRepo.findOne({ where: { referralCode: code }, select: { userId: true } })
  }

  async updateProfile(userId: string, updates: any) {
    await this.profileRepo.update({ userId }, updates)
    return this.profileRepo.findOne({ where: { userId } })
  }

  async createProfile(profile: any) {
    const ent = this.profileRepo.create({
      userId: profile.user_id || profile.userId,
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      plan: profile.plan,
      isPro: profile.is_pro ?? profile.isPro,
      role: profile.role,
    })
    return this.profileRepo.save(ent)
  }
}
