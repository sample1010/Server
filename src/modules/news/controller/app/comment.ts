import { BaseController, CoolController } from '@cool-midway/core';
import { Body, Inject, Post, Provide } from '@midwayjs/decorator';
import { NewsArticleCommentEntity } from '../../entity/comment';
import { NewsCommentApiService } from '../../service/app/comment';

/**
 * 描述
 */
@Provide()
@CoolController({
  prefix: '/app/news/article/comment',
  api: ['page', 'delete', 'update'],
  entity: NewsArticleCommentEntity,
  service: NewsCommentApiService,
})
export class NewsCommentApiController extends BaseController {
  @Inject()
  newsCommentService: NewsCommentApiService;

  /**
   * 新增
   * @param param
   */
  @Post('/create', { summary: '創建留言' })
  async create(@Body() query) {
    return this.ok(await this.newsCommentService.create(query));
  }

  /**
   * 點讚
   * @param param
   */
  @Post('/like', { summary: '留言點讚' })
  async like(@Body() params) {
    return this.ok(await this.newsCommentService.like(params));
  }
}
