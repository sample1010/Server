import { Body, Inject, Post, Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { TipAppService } from '../../service/app/tips';
import { AwardTipsEntity } from '../../entity/tips';

/**
 * 描述
 */
@Provide()
@CoolController({
  prefix: '/app/tip',
  api: ['page'],
  entity: AwardTipsEntity,
  service: TipAppService,
})
export class TipAppController extends BaseController {
  @Inject()
  tipAppService: TipAppService;

  /**
   * 小知識信息
   */
  @Post('/getInfo', { summary: '小知識信息' })
  async getInfo(@Body() param) {
    return this.ok(await this.tipAppService.getInfo(param));
  }

  /**
   * 今日小知識
   */
  @Post('/today', { summary: '今日小知識' })
  async today() {
    return this.ok(await this.tipAppService.today());
  }

  /**
   * 今日小之日
   */
  @Post('/collection', { summary: '收藏登入賞' })
  async collection(@Body() params) {
    return this.ok(await this.tipAppService.collection(params));
  }
}
