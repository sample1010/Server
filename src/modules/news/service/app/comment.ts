import {
  BaseService,
  CoolCommException,
  CoolValidateException,
} from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { NewsArticleEntity } from '../../entity/article';
import { NewsArticleCommentEntity } from '../../entity/comment';
import { NewsArticleCommentLikeEntity } from '../../entity/commentLike';

import * as _ from 'lodash';
import { BaseSysUserEntity } from '../../../base/entity/sys/user';

/**
 * 描述
 */
@Provide()
export class NewsCommentApiService extends BaseService {
  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(NewsArticleEntity)
  newsArticleEntity: Repository<NewsArticleEntity>;

  @InjectEntityModel(NewsArticleCommentEntity)
  newsArticleCommentEntity: Repository<NewsArticleCommentEntity>;

  @InjectEntityModel(NewsArticleCommentLikeEntity)
  newsArticleCommentLikeEntity: Repository<NewsArticleCommentLikeEntity>;

  @Inject()
  ctx;

  /**
   * 分页查询
   * @param query
   */
  async page(query) {
    const { articleId, parentId } = query;
    if (
      articleId &&
      _.isEmpty(
        await this.newsArticleEntity.findOne({
          id: articleId,
        })
      )
    )
      throw new CoolValidateException('找不到該文章');

    if (
      parentId &&
      _.isEmpty(await this.newsArticleCommentEntity.findOne({ id: parentId }))
    )
      throw new CoolValidateException('找不到父評論');

    const userId = this.ctx.user?.userId || 0;

    const sql = `
      SELECT
          a.id,
          a.content,
          a.parentId,
          a.createTime,

          COUNT(c.id) AS likes,
          COUNT(d.id) AS comments,
          IF(SUM(c.userId = ${userId}), TRUE, FALSE) AS isLike,
          b.username AS author
      FROM
          news_comment a
          LEFT JOIN base_sys_user b ON a.createBy = b.id
          LEFT JOIN news_comment_like c ON a.id = c.commentId
          LEFT JOIN news_comment d ON a.id = d.parentId
      WHERE 1 = 1
          ${this.setSql(articleId, 'and a.articleId = ?', [articleId])}
          AND a.deleteTime IS NULL
          ${this.setSql(parentId, 'and a.parentId = ?', [parentId])}
          ${this.setSql(!parentId, 'and a.parentId IS NULL', [])}
      GROUP BY a.id
      `;
    const data = await this.sqlRenderPage(sql, query);
    if (!parentId) await this.detectChild(data.list);
    data.list.forEach(item => (item.isLike = item.isLike === '1'));
    return data;
  }

  async detectChild(list) {
    const fn = async param => {
      return new Promise((resolve, reject) => {
        resolve(this.newsArticleCommentEntity.findOne({ parentId: param.id }));
      });
    };
    const promises = list.map(fn);
    return Promise.all(promises).then(result => {
      list.forEach((item, index) => {
        item.hasChild = !_.isEmpty(result[index]);
      });
    });
  }

  /**
   * 取得子項目
   * @param query
   */
  async child(param) {
    const { parentId } = param;
    if (!parentId || !_.isNumber(parentId)) {
      throw new CoolValidateException('請輸入正確的評論ID');
    }

    const result = await this.nativeQuery(`
        SELECT
            a.id,
            a.content,
            a.likeCount,
            a.parentId,
            a.createTime,

            b.username As author
        FROM
            news_comment a
            LEFT JOIN base_sys_user b ON a.userId = b.id
        WHERE 1 = 1
            and a.isDelete = 0
            and a.parentId = ${parentId}
        GROUP BY a.id
        `);

    return result;
  }

  /**
   * 新增
   * @param query
   */
  async create(query) {
    const { articleId, content, parentId } = query;
    if (_.isEmpty(content)) throw new CoolValidateException('內容不能為空');

    if (_.isEmpty(this.ctx.user)) throw new CoolCommException('用戶未登入');
    const userId = this.ctx.user.userId;

    const exist = await this.newsArticleEntity.findOne({ id: articleId });
    if (_.isEmpty(exist)) throw new CoolValidateException('找不到該文章');

    const { id, createTime } = await this.newsArticleCommentEntity.save({
      articleId,
      content,
      parentId,
      authorId: userId,
      createBy: userId,
      updateBy: userId,
    });

    console.log('article comment create');

    const user = await this.baseSysUserEntity.findOne({
      id: this.ctx.user.userId,
    });

    return {
      id,
      content,
      parentId,
      createTime,
      isLike: false,
      likes: '0',
      comments: '0',
      hasChild: false,
      author: user.username,
    };
  }

  /**
   * 修改
   * @param query
   */
  async update(query) {
    const { id, content } = query;
    if (_.isEmpty(content)) throw new CoolValidateException('內容不能為空');

    if (_.isEmpty(this.ctx.user)) throw new CoolCommException('用戶未登入');
    const userId = this.ctx.user.userId;

    const exist = await this.newsArticleCommentEntity.findOne({
      id,
      createBy: userId,
    });
    if (_.isEmpty(exist)) throw new CoolValidateException('找不到該評論');

    await this.newsArticleCommentEntity.save({
      id,
      content,
    });
  }

  /**
   * 刪除
   * @param ids
   */
  async delete(ids) {
    const deleteIds = [];

    if (!ids) throw new CoolValidateException('請輸入完整的參數');

    if (_.isEmpty(this.ctx.user)) throw new CoolCommException('用戶未登入');
    const userId = this.ctx.user.userId;

    const list = await this.nativeQuery(
      `
      SELECT
          a.id
      FROM
          news_comment a
      WHERE
          a.userId=${userId}
          and a.id in (${ids})
      `
    );
    if (!_.isEmpty(list)) {
      list.forEach(item => {
        deleteIds.push(item.id);
      });
    }

    if (_.isEmpty(deleteIds)) throw new CoolCommException('操作失敗');
    await this.newsArticleCommentEntity.delete(deleteIds);
  }

  async like(params) {
    const { commentId, articleId } = params;
    const user = this.ctx.user;
    if (_.isEmpty(user)) throw new CoolCommException('用戶未登入');

    const commentExist = await this.newsArticleCommentEntity.findOne({
      id: commentId,
    });
    if (_.isEmpty(commentExist)) throw new CoolCommException('留言不存在');

    const likeExist = await this.newsArticleCommentLikeEntity.findOne({
      commentId,
      userId: user.userId,
    });

    const action = _.isEmpty(likeExist) ? 'save' : 'delete';
    await this.newsArticleCommentLikeEntity[action]({
      articleId,
      commentId,
      userId: user.userId,
    });

    return _.isEmpty(likeExist);
  }
}
