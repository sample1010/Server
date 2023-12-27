import { Body, Inject, Post, Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { NewsArticleEntity } from '../../entity/article';
import { NewsArticleCategoryEntity } from '../../entity/articleCategory';
import { SelectQueryBuilder } from 'typeorm';
import { IndustryCategoryEntity } from '../../../industry/entity/category';
import { NewsArticleCommentEntity } from '../../entity/comment';
import { NewsArticleViewEntity } from '../../entity/articleView';
import { NewsArticleLikeEntity } from '../../entity/articleLike';
import { NewsArticleCollectionEntity } from '../../entity/articleCollection';
import { AdminNewsArticleService } from '../../service/admin/article';

/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: NewsArticleEntity,
  service: AdminNewsArticleService,
  pageQueryOp: {
    select: [
      'a.id',
      'a.authorName',
      'a.thumbnail',
      'a.title',
      'a.type',
      'a.isHot',
      'a.isTop',
      'a.commentOpen',
      'a.status',
      'a.updateTime',
      'a.publishTime',
      'a.createTime',
      'GROUP_CONCAT(DISTINCT c.id) as categories',
      'count(d.id) as commentCount',
      'count(e.id) as viewCount',
      'count(f.id) as likeCount',
      'count(g.id) as collectionCount',
    ],
    keyWordLikeFields: ['title', 'authorName'],
    fieldEq: [
      { column: 'a.type', requestParam: 'type' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'b.categoryId', requestParam: 'categoryId' },
      { column: 'c.parentId', requestParam: 'categoryParentId' },
    ],
    join: [
      {
        entity: NewsArticleCategoryEntity,
        alias: 'b',
        condition: 'a.id = b.articleId',
        type: 'leftJoin',
      },
      {
        entity: IndustryCategoryEntity,
        alias: 'c',
        condition: 'b.categoryId = c.id',
        type: 'leftJoin',
      },
      {
        entity: NewsArticleCommentEntity,
        alias: 'd',
        condition: 'a.id = d.articleId',
        type: 'leftJoin',
      },
      {
        entity: NewsArticleViewEntity,
        alias: 'e',
        condition: 'a.id = e.articleId',
        type: 'leftJoin',
      },
      {
        entity: NewsArticleLikeEntity,
        alias: 'f',
        condition: 'a.id = f.articleId',
        type: 'leftJoin',
      },
      {
        entity: NewsArticleCollectionEntity,
        alias: 'g',
        condition: 'a.id = g.articleId',
        type: 'leftJoin',
      },
    ],
    extend: async (find: SelectQueryBuilder<NewsArticleEntity>) => {
      find.groupBy('a.id');
    },
  },
})
export class AdminNewsArticleController extends BaseController {
  @Inject()
  adminNewsArticleService: AdminNewsArticleService;

  /**
   * 瀏覽閱讀紀錄
   */
  @Post('/views', { summary: '閱讀紀錄' })
  async views(@Body() query) {
    return this.ok(await this.adminNewsArticleService.viewLogs(query));
  }

  /**
   * 瀏覽閱讀紀錄
   */
  @Post('/likes', { summary: '閱讀紀錄' })
  async likes(@Body() query) {
    return this.ok(await this.adminNewsArticleService.likeLogs(query));
  }

  /**
   * 瀏覽閱讀紀錄
   */
  @Post('/collections', { summary: '閱讀紀錄' })
  async collections(@Body() query) {
    return this.ok(await this.adminNewsArticleService.collectionLogs(query));
  }
}
