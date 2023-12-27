import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 描述
 */
@EntityModel('news_comment_like')
export class NewsArticleCommentLikeEntity extends BaseEntity {
  @Column({ comment: '文章ID', type: 'bigint' })
  articleId: number;

  @Column({ comment: '留言ID', type: 'bigint' })
  commentId: number;

  @Column({ comment: '用戶ID', type: 'bigint' })
  userId: number;
}
