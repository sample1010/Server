import { EntityModel } from '@midwayjs/orm';
import { Column } from 'typeorm';
import { BaseEventEntity } from '../../../base/entity/baseEvent';

@EntityModel('award_tips')
export class AwardTipsEntity extends BaseEventEntity {
  @Column({ comment: '標題' })
  title: string;

  @Column({ comment: '縮圖', nullable: true, type: 'text' })
  thumbnail: string;

  @Column({ comment: '內容', type: 'mediumtext' })
  content: string;

  @Column({ comment: '發布日期', nullable: true })
  publishDate: String;

  @Column({ comment: '狀態', type: 'tinyint' })
  status: number;

  @Column({ comment: '觀看次數', type: 'int', default: 0 })
  views: number;
}
