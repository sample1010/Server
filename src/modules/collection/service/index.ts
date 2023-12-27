import { BaseService, CoolCommException } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import * as _ from 'lodash';
import { Repository } from 'typeorm';
import { AwardTipsCollectionEntity } from '../../award/entity/tips_collection';
import { TipAppService } from '../../award/service/app/tips';
import { NewsArticleCollectionEntity } from '../../news/entity/articleCollection';

/**
 * 描述
 */
@Provide()
export class CollectionService extends BaseService {
  @InjectEntityModel(NewsArticleCollectionEntity)
  newsArticleCollectionEntity: Repository<NewsArticleCollectionEntity>;

  @InjectEntityModel(AwardTipsCollectionEntity)
  tipCollectionEntity: Repository<AwardTipsCollectionEntity>;

  @Inject()
  tipAppService: TipAppService;

  @Inject()
  ctx;

  /**
   * 描述
   */
  async page(query) {
    const { type, order = 'createTime', sort = 'desc' } = query;
    if (_.isEmpty(type)) throw new CoolCommException('未輸入類型');

    const sql = `
      SELECT
        a.id,
        b.title
      FROM
        news_article_collection a
        LEFT JOIN news_article b ON a.articleId = b.id
      WHERE a.userId = ${this.ctx.user.userId}
    `;
    return await this.renderPage(
      sql,
      _.assign(query, {
        order,
        sort,
      })
    );
  }

  async my(query) {
    const userId = this.ctx.user.userId;
    const {
      type,
      keyWord,
      order = 'publishTime',
      sort = 'desc',
      category,
    } = query;

    if (type === 'article') {
      const sql = `
        SELECT
            a.id,
            a.slug,
            a.title,
            a.thumbnail,
            a.status,
            a.commentOpen,
            a.publishTime,
            (CASE WHEN LENGTH(a.excerpt) > 0 THEN a.excerpt ELSE LEFT(REGEXP_REPLACE(a.content, '<[^>]+>', ''), 80) END) AS excerpt,

            a.authorName as author,
            GROUP_CONCAT(DISTINCT d.name) As categories,
            COUNT(DISTINCT(e.id)) as views,
            COUNT(DISTINCT(f.id)) as likes,
            COUNT(DISTINCT(g.id)) as collections
        FROM
            news_article_collection parent
            LEFT JOIN news_article a ON parent.articleId = a.id
            LEFT JOIN news_article_category b ON a.id = b.articleId
            LEFT JOIN industry_category d ON b.categoryId = d.id
            LEFT JOIN news_article_view e ON a.id = e.articleId
            LEFT JOIN news_article_like f ON a.id = f.articleId
            LEFT JOIN news_article_collection g ON a.id = g.articleId
        WHERE a.status = 9
            AND parent.userId = ${userId}
            ${this.setSql(category, 'AND d.slug = (?)', category)}
            ${this.setSql(keyWord, 'AND (a.title LIKE ?)', [`%${keyWord}%`])}
        GROUP BY a.id
        `;

      const result = await this.sqlRenderPage(
        sql,
        _.assign(query, {
          order,
          sort,
        })
      );

      return result;
    } else if (type === 'tip') {
      const sql = `
        SELECT
            a.id,
            a.title,
            a.thumbnail,
            a.publishDate,
            GROUP_CONCAT(distinct d.name) AS categories

        FROM
            award_tips a
            LEFT JOIN award_tips_collection b on a.id = b.tipId
            LEFT JOIN award_tips_category c on a.id = c.tipId
            LEFT JOIN industry_category d on d.id = c.categoryId
        WHERE b.userId = ${userId}
        GROUP BY a.id
      `;

      const result = await this.sqlRenderPage(
        sql,
        _.assign(query, {
          order: 'publishDate',
          sort,
        })
      );

      return result;
    }
  }
}
