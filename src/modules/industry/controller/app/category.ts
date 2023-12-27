import { Body, Inject, Post, Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { IndustryCategoryEntity } from '../../entity/category';
import { AppIndustryCategoryService } from '../../service/app/category';

/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['list'],
  entity: IndustryCategoryEntity,
  service: AppIndustryCategoryService,
})
export class AdminIndustryCategoryController extends BaseController {
  @Inject()
  appIndustryCategoryService: AppIndustryCategoryService;

  @Post('/info', { summary: '退出' })
  async information(@Body() query) {
    return this.ok(await this.appIndustryCategoryService.info(query));
  }
}
