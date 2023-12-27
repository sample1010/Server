import { BaseService, CoolCommException } from '@cool-midway/core';
import { FORMAT, Inject, Provide, TaskLocal } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { NewsArticleEntity } from '../../entity/article';
import { NewsArticleCategoryEntity } from '../../entity/articleCategory';
import { NewsArticleLikeEntity } from '../../entity/articleLike';
import { NewsArticleViewEntity } from '../../entity/articleView';
import { NewsArticleCommentEntity } from '../../entity/comment';
import { NewsArticleCommentLikeEntity } from '../../entity/commentLike';
/**
 * 描述
 */
@Provide()
export class AdminNewsArticleService extends BaseService {
  @InjectEntityModel(NewsArticleEntity)
  newsArticleEntity: Repository<NewsArticleEntity>;

  @InjectEntityModel(NewsArticleCategoryEntity)
  newsArticleCategoryEntity: Repository<NewsArticleCategoryEntity>;

  @InjectEntityModel(NewsArticleViewEntity)
  newsArticleViewEntity: Repository<NewsArticleViewEntity>;

  @InjectEntityModel(NewsArticleLikeEntity)
  newsArticleLikeEntity: Repository<NewsArticleLikeEntity>;

  @InjectEntityModel(NewsArticleCommentEntity)
  newsArticleCommentEntity: Repository<NewsArticleCommentEntity>;

  @InjectEntityModel(NewsArticleCommentLikeEntity)
  newsArticleCommentLikeEntity: Repository<NewsArticleCommentLikeEntity>;

  @Inject()
  ctx;

  async page(query) {
    const { keyWord, type, status, categoryId } = query;
    const result = await this.sqlRenderPage(
      `
      SELECT
        a.id,
        a.authorName,
        a.thumbnail,
        a.title,
        a.type,
        a.isHot,
        a.isTop,
        a.commentOpen,
        a.status,
        a.updateTime,
        a.publishTime,
        a.createTime,

        GROUP_CONCAT(DISTINCT f.categoryId) as categories,
        COUNT(DISTINCT b.id) as viewCount,
        COUNT(DISTINCT c.id) as likeCount,
        COUNT(DISTINCT d.id) as commentCount,
        COUNT(DISTINCT e.id) as collectionCount
      FROM
        news_article a
        LEFT JOIN news_article_view b ON a.id = b.articleId
        LEFT JOIN news_article_like c ON a.id = c.articleId
        LEFT JOIN news_comment d ON a.id = d.articleId
        LEFT JOIN news_article_collection e ON a.id = e.articleId
        LEFT JOIN news_article_category f ON a.id = f.articleId
      WHERE 1=1
        ${this.setSql(categoryId, 'AND f.categoryId = (?)', categoryId)}
        ${this.setSql(status, 'AND a.status = (?)', status)}
        ${this.setSql(type, 'AND a.type = (?)', type)}
        ${this.setSql(keyWord, 'and (a.title LIKE ? or a.authorName LIKE ?)', [
        `%${keyWord}%`,
        `%${keyWord}%`,
      ])}
        GROUP BY a.id
    `,
      query
    );
    return result;
  }

  /**
   * 刪除文章
   * @param articleId
   */
  async delete(ids) {
    let idArr;
    if (ids instanceof Array) {
      idArr = ids;
    } else {
      idArr = ids.split(',');
    }
    for (const id of idArr) {
      await this.newsArticleEntity.delete({ id });
      await this.newsArticleCategoryEntity.delete({ articleId: id });
      await this.newsArticleViewEntity.delete({ articleId: id });
      await this.newsArticleLikeEntity.delete({ articleId: id });
      await this.newsArticleCommentEntity.delete({ articleId: id });
      await this.newsArticleCommentLikeEntity.delete({ articleId: id });
    }
  }

  async add(params) {
    const { categories } = params;
    if (!categories) throw new CoolCommException('請選擇分類');

    if (params.status === 9) {
      params.publishTime = new Date();
    }

    const article = await this.newsArticleEntity.save({
      ...params,
      createBy: this.ctx.admin.userId,
      updateBy: this.ctx.admin.userId,
    });

    await this.updateCategories({ ...params, id: article.id });

    return article;
  }

  async update(params) {
    const articleExist = await this.newsArticleEntity.findOne({
      id: params.id,
    });

    if (params.status === 9 && articleExist.status !== 9) {
      params.publishTime = new Date();
    }

    const article = await this.newsArticleEntity.save({
      ...params,
      updateBy: this.ctx.admin.userId,
    });

    await this.updateCategories(params);

    return article;
  }

  async info(id) {
    const info = await this.newsArticleEntity.findOne({ id });
    if (!info.authorIntro) info.authorIntro = '';

    const categories = await this.nativeQuery(
      `
      SELECT
        categoryId
      FROM news_article_category
      WHERE articleId = ${id}
    `
    );
    return {
      ...info,
      categories: categories?.map(e => parseInt(e.categoryId)),
    };
  }

  // 定時任務，監測排程
  @TaskLocal(FORMAT.CRONTAB.EVERY_MINUTE)
  async watchArticleStatus() {
    const articles = await this.newsArticleEntity.find({ status: 10 });
    articles.forEach(async article => {
      const targetTime = new Date(article.publishTime);
      const currentTime = new Date();
      if (currentTime >= targetTime) {
        await this.newsArticleEntity.save({
          id: article.id,
          status: 9,
        });
      }
    });
  }

  /**
   * 更新分類关系
   * @param user
   */
  async updateCategories(article) {
    await this.newsArticleCategoryEntity.delete({ articleId: article.id });
    if (article.categories) {
      for (const category of article.categories) {
        await this.newsArticleCategoryEntity.save({
          articleId: article.id,
          categoryId: category,
        });
      }
    }
  }

  /**
   * 閱讀紀錄
   * @param articleId
   */
  async viewLogs(query) {
    const { articleId } = query;
    if (!articleId) throw new CoolCommException('請輸入articleId');
    return await this.sqlRenderPage(
      `
      SELECT
        a.id,
        a.createTime,
        concat(b.firstName, ' ', b.lastName) As name
      FROM
        news_article_view a
        LEFT JOIN base_sys_user b ON a.userId = b.id
      WHERE 1=1
      ${this.setSql(articleId, 'and a.articleId = ?', [articleId])}
      GROUP BY a.id
    `,
      query
    );
  }

  /**
   * 點贊紀錄
   * @param articleId
   */
  async likeLogs(query) {
    const { articleId } = query;
    return await this.sqlRenderPage(
      `
      SELECT
        a.id,
        a.createTime,
        concat(b.firstName, ' ', b.lastName) As name
      FROM
        news_article_like a
        LEFT JOIN base_sys_user b ON a.userId = b.id
      WHERE 1=1
      ${this.setSql(articleId, 'and a.articleId in (?)', [articleId])}
      GROUP BY a.id
    `,
      query
    );
  }

  /**
   * 收藏紀錄
   * @param articleId
   */
  async collectionLogs(query) {
    const { articleId } = query;
    return await this.sqlRenderPage(
      `
      SELECT
        a.id,
        a.createTime,
        concat(b.firstName, ' ', b.lastName) As name
      FROM
        news_article_collection a
        LEFT JOIN base_sys_user b ON a.userId = b.id
      WHERE 1=1
      ${this.setSql(articleId, 'and a.articleId in (?)', [articleId])}
      GROUP BY a.id
    `,
      query
    );
  }
}
