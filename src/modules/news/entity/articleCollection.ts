import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 描述
 */
@EntityModel('news_article_collection')
export class NewsArticleCollectionEntity extends BaseEntity {
  @Column({ comment: '文章ID', type: 'bigint' })
  articleId: number;

  @Column({ comment: '用戶ID', type: 'bigint' })
  userId: number;
}
