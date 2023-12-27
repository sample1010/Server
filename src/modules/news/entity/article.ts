import { EntityModel } from '@midwayjs/orm';
import { Column, Index } from 'typeorm';
import { BaseDeleteEntity } from '../../../base/entity/baseDelete';

@EntityModel('news_article')
export class NewsArticleEntity extends BaseDeleteEntity {
  @Index()
  @Column({ comment: '標題' })
  title: string;

  @Column({ comment: 'meta標題', nullable: true })
  metaTitle: string;

  @Column({ comment: 'meta描述', nullable: true })
  metaDescription: string;

  @Index({ unique: true })
  @Column({ comment: '代稱' })
  slug: string;

  @Column({ comment: '完整文章', type: 'mediumtext' })
  content: string;

  @Column({ comment: '預覽內容', type: 'mediumtext' })
  contentPreview: string;

  @Column({ comment: '摘錄', nullable: true })
  excerpt: string;

  @Column({ comment: '縮圖', nullable: true })
  thumbnail: string;

  @Column({ comment: '開啟評論', default: true })
  commentOpen: boolean;

  @Column({ comment: '置頂新聞', default: false })
  isTop: boolean;

  @Column({ comment: '熱門新聞', default: false })
  isHot: boolean;

  @Column({ comment: '狀態', type: 'tinyint' })
  status: number;

  @Column({ comment: '發布時間', nullable: true })
  publishTime: Date;

  @Column({ comment: '類型', type: 'tinyint' })
  type: number;

  @Column({ comment: '影片網址', nullable: true })
  videoUrl: string;

  // 作者
  @Column({ comment: '作者頭像', nullable: true })
  authorAvatar: string;

  // 作者
  @Column({ comment: '作者姓名' })
  authorName: string;

  // 作者
  @Column({ comment: '作者簡介', type: 'mediumtext', nullable: true })
  authorIntro: string;

  // 分類ID列表
  categories: number[];
}
