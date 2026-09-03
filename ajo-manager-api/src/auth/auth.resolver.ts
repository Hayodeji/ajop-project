import { Resolver, Query, Mutation, Args } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import { GqlAuthGuard } from './gql-auth.guard'
import { CurrentUser } from './current-user.decorator'
import { AuthService } from './auth.service'
import { Profile, AuthResponse } from './auth.schema'
import { CheckPhoneInput, CompleteProfileInput, ForgotPasswordInput, ResetPasswordInput } from './auth.dto'

@Resolver(() => Profile)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async checkPhone(@Args('input') input: CheckPhoneInput) {
    return this.authService.checkPhone(input.phone).then(res => ({
      success: true,
      message: res.isNewUser ? 'New user' : 'Existing user'
    }))
  }

  @Mutation(() => Profile)
  @UseGuards(GqlAuthGuard)
  completeProfile(
    @CurrentUser() user: any,
    @Args('input') input: CompleteProfileInput,
  ) {
    const authPhone = (user.phone ?? '').replace(/\s/g, '') || undefined
    return this.authService.completeProfile(user.id, input, authPhone)
  }

  @Query(() => Profile)
  @UseGuards(GqlAuthGuard)
  profile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id)
  }

  @Mutation(() => AuthResponse)
  forgotPassword(@Args('input') input: ForgotPasswordInput) {
    return this.authService.forgotPassword(input)
  }

  @Mutation(() => AuthResponse)
  @UseGuards(GqlAuthGuard)
  async resetPassword(
    @CurrentUser() user: any,
    @Args('input') input: ResetPasswordInput,
  ) {
    return this.authService.resetPassword(user.id, input.password).then(() => ({
      success: true,
      message: 'Password reset successful'
    }))
  }
}
