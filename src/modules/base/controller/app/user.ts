import { Provide, Inject, Body, Post } from '@midwayjs/decorator';
import { CoolController, BaseController, CoolEps } from '@cool-midway/core';
import { BaseSysUserEntity } from '../../entity/sys/user';
import { BaseApiUserService } from '../../service/app/user';
import { BaseSysParamService } from '../../service/sys/param';
import { Context } from '@midwayjs/koa';
import { Validate } from '@midwayjs/validate';
import { UserIdentityService } from '../../service/app/identity';

/**
 * 不需要登錄的後台接口
 */
@Provide()
@CoolController({
  prefix: '/app/user',
  api: ['delete', 'info'],
  entity: BaseSysUserEntity,
  service: BaseApiUserService,
})
export class BaseAppUserController extends BaseController {
  @Inject()
  baseApiUserService: BaseApiUserService;

  @Inject()
  baseSysParamService: BaseSysParamService;

  @Inject()
  userIdentityService: UserIdentityService;

  @Inject()
  ctx: Context;

  @Inject()
  eps: CoolEps;

  /**
   * 取得個人資料
   */
  @Post('/person', { summary: '個人資料' })
  async person() {
    return this.ok(await this.baseApiUserService.person());
  }

  /**
   * 修改個人資料
   */
  @Post('/personUpdate', { summary: '個人資料' })
  async personUpdate(@Body() params) {
    return this.ok(await this.baseApiUserService.personUpdate(params));
  }

  /**
   * 重設密碼
   */
  @Post('/reset-password', { summary: '重設密碼' })
  @Validate()
  async resetPassword(@Body() params) {
    return this.ok(await this.baseApiUserService.resetPassword(params));
  }

  /**
   * 綁定Email
   */
  @Post('/change-phone', { summary: '修改電話' })
  async changePhone(@Body() params) {
    return this.ok(await this.baseApiUserService.changePhone(params));
  }

  /**
   * 綁定Email
   */
  @Post('/email-binding', { summary: '綁定Email' })
  async emailBinding(@Body() params) {
    return this.ok(await this.baseApiUserService.emailBinding(params));
  }

  /**
   * 退出
   */
  @Post('/logout', { summary: '退出' })
  async logout() {
    await this.baseApiUserService.logout();
    return this.ok();
  }
  @Post('/identity-cert', { summary: '身份驗證' })
  @Validate()
  async identityCert(@Body() param) {
    return this.ok(await this.userIdentityService.identityCert(param));
  }

  /**
   * 身份驗證
   */
  @Post('/identity-verify', { summary: '身份驗證請求' })
  async identityVerify(@Body() params) {
    return this.ok(await this.userIdentityService.identityVerify(params));
  }
}
