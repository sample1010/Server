import { Provide, Inject, Body, Post } from '@midwayjs/decorator';
import {
  CoolController,
  BaseController,
  CoolEps,
  CoolCommException,
} from '@cool-midway/core';
import { BaseSysUserEntity } from '../../entity/sys/user';
import { BaseApiUserService } from '../../service/app/user';
import { BaseSysParamService } from '../../service/sys/param';
import { Context } from '@midwayjs/koa';
import { AppNewsArticleService } from '../../../news/service/app/article';
import { CollectionService } from '../../../collection/service';
import { TipAppService } from '../../../award/service/app/tips';

/**
 * 不需要登錄的後台接口
 */
@Provide()
@CoolController({
  prefix: '/app/my',
  api: ['delete', 'info'],
  entity: BaseSysUserEntity,
  service: BaseApiUserService,
})
export class BaseAppUserController extends BaseController {
  @Inject()
  newsArticleApiService: AppNewsArticleService;

  @Inject()
  collectionService: CollectionService;

  @Inject()
  baseApiUserService: BaseApiUserService;

  @Inject()
  baseSysParamService: BaseSysParamService;

  @Inject()
  tipAppService: TipAppService;

  @Inject()
  ctx: Context;

  @Inject()
  eps: CoolEps;

  /**
   * 收藏
   * @param params
   */
  // @Post('/articles', { summary: '發布項目' })
  // async myArticle(@Body() params) {
  //   return this.ok(await this.newsArticleApiService.myArticle(params));
  // }

  /**
   * 瀏覽紀錄
   * @param params
   */
  @Post('/history', { summary: '瀏覽紀錄' })
  async articleViewHistory(@Body() params) {
    const { type } = params;
    if (type === 'article') {
      return this.ok(await this.newsArticleApiService.viewHistory(params));
    } else if (type === 'tip') {
      return this.ok(await this.tipAppService.viewHistory(params));
    } else {
      throw new CoolCommException('不允許的參數內容');
    }
  }

  /**
   * 收藏
   * @param params
   */
  @Post('/collections', { summary: '收藏項目' })
  async myCollections(@Body() params) {
    return this.ok(await this.collectionService.my(params));
  }

  /**
   * 小知識
   * @param params
   */
  @Post('/tips', { summary: '小知識' })
  async myTips(@Body() params) {
    return this.ok(await this.tipAppService.page(params));
  }
}
