import { EntityModel } from '@midwayjs/orm';
import { Column } from 'typeorm';
import { BaseDeleteEntity } from '../../../base/entity/baseDelete';

/**
 * 描述
 */
@EntityModel('news_comment')
export class NewsArticleCommentEntity extends BaseDeleteEntity {
  @Column({ comment: '文章ID', type: 'bigint' })
  articleId: number;

  @Column({ comment: '內容' })
  content: string;

  @Column({ comment: '父ID', type: 'bigint', nullable: true })
  parentId: number;

  @Column({ comment: '用戶ID', type: 'bigint' })
  authorId: number;
}
