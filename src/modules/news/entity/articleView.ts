import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

@EntityModel('news_article_view')
export class NewsArticleViewEntity extends BaseEntity {
  @Column({ comment: '文章ID', type: 'bigint' })
  articleId: number;

  @Column({ comment: '用戶ID', type: 'bigint' })
  userId: number;

  @Column({ comment: 'count', type: 'bigint' })
  count: number;
}
