import { BaseEntity } from '@cool-midway/core';
import { EntityModel } from '@midwayjs/orm';
import { Column } from 'typeorm';

@EntityModel('news_article_category')
export class NewsArticleCategoryEntity extends BaseEntity {
  @Column({ comment: '文章ID', type: 'bigint' })
  articleId: number;

  @Column({ comment: '分類ID', type: 'bigint' })
  categoryId: number;
}
