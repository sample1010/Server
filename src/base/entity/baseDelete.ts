import { Column, DeleteDateColumn, Index } from 'typeorm';
import { BaseEventEntity } from './baseEvent';

export class BaseDeleteEntity extends BaseEventEntity {
  @Index()
  @Column({ comment: '刪除用戶ID', type: 'bigint', nullable: true })
  deleteBy: number;

  @DeleteDateColumn({ comment: '刪除時間' })
  deleteTime: Date;
}
