import { Body, Inject, Post, Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Validate } from '@midwayjs/validate';
import { BaseAppAuthService } from '../../service/app/auth';
import { BaseApiUserService } from '../../service/app/user';

/**
 * 商品
 */
@Provide()
@CoolController('/app/auth')
export class AppAuthController extends BaseController {
  @Inject()
  baseAppAuthService: BaseAppAuthService;

  @Inject()
  baseApiUserService: BaseApiUserService;

  /**
   * 登錄
   * @param login
   */
  @Post('/login', { summary: '登錄' })
  @Validate()
  async login(@Body() login) {
    return this.ok(await this.baseAppAuthService.login(login));
  }

  /**
   * 註冊
   * @param register
   */
  @Post('/register', { summary: '註冊' })
  @Validate()
  async register(@Body() register) {
    return this.ok(await this.baseAppAuthService.register(register));
  }

  /**
   * 註冊
   * @param forgot
   */
  @Post('/forgot', { summary: '忘記密碼' })
  @Validate()
  async forgot(@Body() forgot) {
    return this.ok(await this.baseAppAuthService.forgot(forgot));
  }

  /**
   * 獲得驗證碼
   * @param captcha
   */
  @Post('/captcha', { summary: '獲取驗證碼' })
  @Validate()
  async captcha(@Body() params) {
    return this.ok(await this.baseAppAuthService.captcha(params));
  }

  /**
   * 刷新token
   */
  @Post('/refreshToken', { summary: '刷新token' })
  async refreshToken(@Body() params) {
    return this.ok(await this.baseAppAuthService.refreshToken(params));
  }

  /**
   * 驗證Email
   */
  @Post('/email-verify', { summary: '驗證Email' })
  async emailVerify(@Body() params) {
    return this.ok(await this.baseApiUserService.emailVerify(params));
  }
}
