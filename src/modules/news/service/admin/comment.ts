import { BaseService } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { NewsArticleCommentEntity } from '../../entity/comment';

/**
 * 描述
 */
@Provide()
export class NewsArticleCommentAdminService extends BaseService {
  @InjectEntityModel(NewsArticleCommentEntity)
  newsArticleCommentEntity: Repository<NewsArticleCommentEntity>;

  @Inject()
  ctx;

  async add(param) {
    const userId = this.ctx.admin.userId;
    return await this.newsArticleCommentEntity.save({
      ...param,
      createBy: userId,
      updateBy: userId,
    });
  }

  async update(param) {
    const { isDelete } = param;
    const userId = this.ctx.admin.userId;
    if (isDelete) {
      param.deleteTime = new Date();
      param.deleteBy = this.ctx.admin.userId;
    } else {
      param.deleteTime = null;
      param.deleteBy = null;
    }
    return await this.newsArticleCommentEntity.save({
      ...param,
      updateBy: userId,
    });
  }

  async page(query) {
    const { articleId } = query;
    return this.sqlRenderPage(
      `
      SELECT
        a.id,
        a.content,
        a.deleteTime,
        a.parentId,
        a.createTime,
        a.updateTime,

        COUNT(b.id) as likeCount,
        CONCAT(c.firstName, c.lastName) as author

      FROM
        news_comment a
        LEFT JOIN news_comment_like b ON a.id = b.commentId
        LEFT JOIN base_sys_user c ON a.authorId = c.id
      WHERE 1=1
      ${this.setSql(articleId, 'and a.articleId = ?', [articleId])}
      GROUP BY a.id
    `,
      query
    );
  }

  async list(query) {
    const { articleId, parent } = query;
    return this.nativeQuery(`
      SELECT
        a.id,
        a.content
      FROM
        news_comment a
      WHERE 1=1
        ${this.setSql(articleId, 'and a.articleId = ?', [articleId])}
        ${this.setSql(parent, 'and a.parentId IS NULL', [])}
    `);
  }

  async info(id) {
    return this.newsArticleCommentEntity.findOne({ id }, { withDeleted: true });
  }
}
