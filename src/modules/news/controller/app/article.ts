import { Body, Inject, Post, Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { AppNewsArticleService } from '../../service/app/article';
import { Context } from '@midwayjs/koa';
import { Validate } from '@midwayjs/validate';

/**
 * 描述
 */
@Provide()
@CoolController('/app/news/article')
export class NewsArticleController extends BaseController {
  @Inject()
  ctx: Context;

  @Inject()
  appNewsArticleService: AppNewsArticleService;

  /**
   * 分頁
   * @query query
   */
  @Post('/page', { summary: '分頁' })
  async getPage(@Body() query) {
    return this.ok(await this.appNewsArticleService.page(query));
  }

  /**
   * 列表
   */
  @Post('/list', { summary: '列表' })
  async getList(@Body() query) {
    return this.ok(await this.appNewsArticleService.list(query));
  }

  /**
   * 分類
   * @param param
   */
  @Post('/categories', { summary: '取得留言' })
  async getArticleCategories() {
    return this.ok(await this.appNewsArticleService.getCategories());
  }

  /**
   * 分類
   * @param param
   */
  @Post('/info', { summary: '文章內容' })
  async getArticle(@Body() param) {
    return this.ok(await this.appNewsArticleService.getArticle(param));
  }

  /**
   * 點贊
   * @param param
   */
  @Post('/like', { summary: '點贊' })
  async articleLike(@Body() param) {
    return this.ok(await this.appNewsArticleService.articleLike(param));
  }

  /**
   * 新增
   * @param article
   */
  @Post('/create', { summary: '新增' })
  @Validate()
  async articleNew(@Body() article) {
    return this.ok(await this.appNewsArticleService.add(article));
  }

  /**
   * 刪除
   * @param params
   */
  @Post('/delete', { summary: '刪除' })
  @Validate()
  async articleDelete(@Body() params) {
    return this.ok(await this.appNewsArticleService.delete(params));
  }

  /**
   * 收藏
   * @param params
   */
  @Post('/collection', { summary: '收藏' })
  async articleCollection(@Body() params) {
    return this.ok(await this.appNewsArticleService.collection(params));
  }
}
