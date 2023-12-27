import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

export class BaseEventEntity extends BaseEntity {
  @Index()
  @Column({ comment: '建立用戶ID', type: 'bigint' })
  createBy: number;

  @Index()
  @Column({ comment: '更新用戶ID', type: 'bigint' })
  updateBy: number;
}
