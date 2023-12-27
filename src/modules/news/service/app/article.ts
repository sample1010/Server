import {
  BaseService,
  CoolCommException,
  CoolValidateException,
} from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { NewsArticleEntity } from '../../entity/article';

import { CacheManager } from '@midwayjs/cache';
import * as _ from 'lodash';
import { BaseSysUserEntity } from '../../../base/entity/sys/user';
import { NewsArticleCategoryEntity } from '../../entity/articleCategory';
import { NewsArticleCollectionEntity } from '../../entity/articleCollection';
import { NewsArticleLikeEntity } from '../../entity/articleLike';
import { NewsArticleViewEntity } from '../../entity/articleView';
import { NewsArticleCommentEntity } from '../../entity/comment';

/**
 * 描述
 */
@Provide()
export class AppNewsArticleService extends BaseService {
  @InjectEntityModel(NewsArticleEntity)
  newsArticleEntity: Repository<NewsArticleEntity>;

  @InjectEntityModel(NewsArticleCategoryEntity)
  newsArticleCategoryEntity: Repository<NewsArticleCategoryEntity>;

  @InjectEntityModel(NewsArticleCommentEntity)
  newsArticleCommentEntity: Repository<NewsArticleCommentEntity>;

  @InjectEntityModel(NewsArticleLikeEntity)
  newsArticleLikeEntity: Repository<NewsArticleLikeEntity>;

  @InjectEntityModel(NewsArticleViewEntity)
  newsArticleViewEntity: Repository<NewsArticleViewEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(NewsArticleCollectionEntity)
  newsArticleCollectionEntity: Repository<NewsArticleCollectionEntity>;

  @Inject()
  ctx;

  @Inject()
  cacheManager: CacheManager;

  /**
   * 新增
   * @param article
   */
  async add(article: any) {
    return await this.newsArticleEntity.save(article);
    // const info = await this.newsArticleEntity
    //   .createQueryBuilder()
    //   .insert()
    //   .values(article)
    //   .execute();
    // return info;
  }

  /**
   * 取得內容
   * @param query
   */
  async getArticle(query) {
    const { slug, client } = query;
    if (_.isEmpty(slug)) throw new CoolCommException('請輸入代稱');
    const user = this.ctx.user;
    const userEmpty = _.isEmpty(user);

    const sql = `SELECT
        a.id,
        a.title,
        a.slug,
        a.thumbnail,
        a.commentOpen,
        a.publishTime,
        a.metaTitle,
        a.metaDescription,
        a.authorAvatar,
        a.authorName,
        a.authorIntro,
        a.type,
        IF(${userEmpty}=true, a.contentPreview, a.content) AS content,
        IF(${userEmpty}=true, TRUE, FALSE) AS isPreview,

        IFNULL(views, 0) AS views,
        IFNULL(likes, 0) AS likes,
        IFNULL(collections, 0) AS collections

    FROM
        news_article a
        LEFT JOIN (
            SELECT articleId, COUNT(DISTINCT id) AS views
            FROM news_article_view
            GROUP BY articleId
        ) b ON a.id = b.articleId
        LEFT JOIN (
            SELECT articleId, COUNT(DISTINCT id) AS likes
            FROM news_article_like
            GROUP BY articleId
        ) c ON a.id = c.articleId
        LEFT JOIN (
            SELECT articleId, COUNT(DISTINCT id) AS collections
            FROM news_article_collection
            GROUP BY articleId
        ) d ON a.id = d.articleId

    WHERE a.status = '9' AND a.slug = '${slug}'
    LIMIT 1;
    `;
    const [info] = await this.nativeQuery(sql);
    info.isPreview = Boolean(info.isPreview);

    // 判斷文章是否存在
    if (_.isEmpty(info)) throw new CoolValidateException('文章不存在');

    const categories = await this.nativeQuery(`
      SELECT
        b.name,
        b.slug,
        b.parentId
      FROM
        news_article_category a
        LEFT JOIN industry_category b ON a.categoryId = b.id
      WHERE a.articleId = ${info.id}
      GROUP BY a.id
    `);

    const other = {
      isLike: false,
      isCollection: false,
    };

    if (!_.isEmpty(user)) {
      other.isLike = !_.isEmpty(
        await this.newsArticleLikeEntity.findOne({
          articleId: info.id,
          userId: user.userId,
        })
      );
      other.isCollection = !_.isEmpty(
        await this.newsArticleCollectionEntity.findOne({
          articleId: info.id,
          userId: user.userId,
        })
      );
    }

    if (client) {
      this.articleView({ id: info.id });
    }

    return { ...info, categories, ...other };
  }

  /**
   * 分页查询
   * @param query
   */
  async page(query) {
    const {
      keyWord,
      order = 'publishTime',
      sort = 'desc',
      isHot,
      isTop,
      category,
      type,
    } = query;
    const sql = `
        SELECT
            a.id,
            a.slug,
            a.title,
            a.thumbnail,
            a.commentOpen,
            a.publishTime,
            a.authorName as author,
            (CASE WHEN LENGTH(a.excerpt) > 0 THEN a.excerpt ELSE LEFT(REGEXP_REPLACE(contentPreview, '<[^>]+>', ''), 80) END) AS excerpt,

            GROUP_CONCAT(DISTINCT c.name) As categories,
            MAX(c.slug) As categorySlug,
            COUNT(DISTINCT(e.id)) as views,
            COUNT(DISTINCT(f.id)) as likes,
            COUNT(DISTINCT(g.id)) as collections
        FROM
            news_article a
            LEFT JOIN news_article_category b ON a.id = b.articleId
            LEFT JOIN industry_category c ON b.categoryId = c.id
            LEFT JOIN news_article_view e ON a.id = e.articleId
            LEFT JOIN news_article_like f ON a.id = f.articleId
            LEFT JOIN news_article_collection g ON a.id = g.articleId
        WHERE a.status = 9
            ${this.setSql(category, 'AND c.slug = (?)', category)}
            ${this.setSql(type, 'AND a.type = (?)', type)}
            ${this.setSql(isHot, 'AND a.isHot = ?', isHot)}
            ${this.setSql(isTop, 'AND a.isTop = ?', isTop)}
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
  }

  /**
   * 列表查询
   * @param query
   */
  async list(query: any) {
    const {
      keyWord,
      order = 'publishTime',
      sort = 'desc',
      isHot,
      isTop,
      size,
      category,
      type,
    } = query;
    const result = await this.nativeQuery(`
        SELECT
          a.id,
          a.title,
          a.excerpt,
          a.thumbnail,
          a.slug,
          a.type,
          a.publishTime,
          (CASE WHEN LENGTH(a.excerpt) > 0 THEN a.excerpt ELSE LEFT(REGEXP_REPLACE(a.content, '<[^>]+>', ''), 80) END) AS excerpt,

          a.authorName,
          GROUP_CONCAT(DISTINCT c.name) AS categories,
          MAX(c.slug) As categorySlug,
          COUNT(DISTINCT(e.id)) as views,
          COUNT(DISTINCT(f.id)) as likes,
          COUNT(DISTINCT(g.id)) as collections
        FROM
          news_article a
          LEFT JOIN news_article_category b ON a.id = b.articleId
          LEFT JOIN industry_category c ON b.categoryId = c.id
          LEFT JOIN news_article_view e ON a.id = e.articleId
          LEFT JOIN news_article_like f ON a.id = f.articleId
          LEFT JOIN news_article_collection g ON a.id = g.articleId
        where a.status = 9
          ${this.setSql(category, 'and c.slug = (?)', category)}
          ${this.setSql(isTop, 'and a.isTop = (?)', isTop)}
          ${this.setSql(type, 'and a.type = (?)', type)}
          ${this.setSql(isHot, 'and a.isHot = (?)', isHot)}
          ${this.setSql(keyWord, 'and (a.title LIKE ?)', [`%${keyWord}%`])}
        GROUP BY a.id
        ${order ? `ORDER BY ${order} ${sort}` : ''}
        ${this.setSql(size, 'LIMIT ?', size)}
      `);
    return result;
  }

  /**
   * 取得分類
   * @param query
   */
  async getCategories() {
    const result = await this.nativeQuery(`
      SELECT
        a.id,
        a.name,
        a.slug,
        a.icon,
        a.parentId,
        IF(b.id, true, false) as news
      FROM
        industry_category a
        LEFT JOIN news_article_category b ON a.id = b.categoryId
      WHERE 1=1
      GROUP BY a.id
    `);

    return result;
  }

  /**
   * 關聯評論
   * @param ids
   */
  async getCommentByArticle(article) {
    return await this.newsArticleCommentEntity.find({ articleId: article.id });
  }

  /**
   * 按讚
   * @param param
   */
  async articleLike(param) {
    const user = this.ctx.user;
    if (_.isEmpty(user)) throw new CoolCommException('請登入帳號');
    const { id } = param;
    if (!id) throw new CoolValidateException('請輸入完整的參數');

    const likeExist = await this.newsArticleLikeEntity.findOne({
      articleId: id,
      userId: this.ctx.user.userId,
    });

    const action = _.isEmpty(likeExist) ? 'save' : 'delete';
    await this.newsArticleLikeEntity[action]({
      articleId: id,
      userId: user.userId,
    });
    return { id, status: _.isEmpty(likeExist) };
  }

  /**
   * 觀看
   * @param param
   */
  async articleView({ id }) {
    const user = this.ctx.user;

    if (_.isEmpty(user)) return;

    const viewExist = await this.newsArticleViewEntity.findOne({
      articleId: id,
      userId: user?.userId || 0,
    });

    if (_.isEmpty(viewExist)) {
      await this.newsArticleViewEntity.save({
        articleId: id,
        userId: user?.userId || 0,
        count: 1,
      });
    } else {
      if (_.isEmpty(user)) {
        await this.newsArticleViewEntity.save({
          id: viewExist.id,
          articleId: id,
          userId: 0,
          count: +viewExist.count + 1,
        });
      }
    }
  }

  async collection({ id }) {
    const user = this.ctx.user;
    if (_.isEmpty(user)) throw new CoolCommException('請登入帳號');
    if (!id) throw new CoolCommException('請輸入ID');
    const articleExist = await this.newsArticleEntity.findOne({ id });
    if (_.isEmpty(articleExist)) throw new CoolCommException('找不到該文章');
    const collectionExist = await this.newsArticleCollectionEntity.findOne({
      articleId: id,
      userId: user.userId,
    });

    const action = _.isEmpty(collectionExist) ? 'save' : 'delete';
    await this.newsArticleCollectionEntity[action]({
      articleId: id,
      userId: user.userId,
    });
    return { id, status: _.isEmpty(collectionExist) };
  }

  async viewHistory(query) {
    const userId = this.ctx.user.userId;
    const { keyWord, order = 'publishTime', sort = 'desc', category } = query;
    const sql = `
        SELECT
            b.id,
            b.slug,
            b.title,
            b.thumbnail,
            b.status,
            b.commentOpen,
            b.publishTime,

            b.authorName,
            GROUP_CONCAT(DISTINCT e.name) As categories,
            MAX(e.slug) As categorySlug,
            COUNT(DISTINCT(f.id)) as likes,
            COUNT(DISTINCT(g.id)) as collections,
            COUNT(DISTINCT(h.id)) as views
        FROM
            news_article_view a
            LEFT JOIN news_article b ON a.articleId = b.id
            LEFT JOIN news_article_category c ON b.id = c.articleId
            LEFT JOIN industry_category e ON c.categoryId = e.id
            LEFT JOIN news_article_like f ON b.id = f.articleId
            LEFT JOIN news_article_collection g ON b.id = g.articleId
            LEFT JOIN news_article_view h ON b.id = h.articleId

        WHERE b.status = '9'
            AND a.userId = ${userId}
            ${this.setSql(category, 'AND e.slug = (?)', category)}
            ${this.setSql(keyWord, 'AND (b.title LIKE ?)', [`%${keyWord}%`])}
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
  }
}
