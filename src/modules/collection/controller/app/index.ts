import { Body, Inject, Post, Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { CollectionService } from '../../service';

/**
 * 描述
 */
@Provide()
@CoolController('/app/collection')
export class CollectionController extends BaseController {
  @Inject()
  collectionService: CollectionService;

  /**
   * 分頁
   * @param param
   */
  @Post('/page', { summary: '取得收藏列表' })
  async getPage(@Body() query) {
    return this.ok(await this.collectionService.page(query));
  }

  /**
   * 分頁
   * @param param
   */
  @Post('/delete', { summary: '刪除收藏項目' })
  async deleteItem(@Body() query) {
    return this.ok(await this.collectionService.delete(query));
  }
}
