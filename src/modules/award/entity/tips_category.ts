import { BaseEntity } from '@cool-midway/core';
import { EntityModel } from '@midwayjs/orm';
import { Column } from 'typeorm';

@EntityModel('award_tips_category')
export class AwardTipsCategoryEntity extends BaseEntity {
  @Column({ comment: '小知識ID', type: 'bigint' })
  tipId: number;

  @Column({ comment: '分類ID', type: 'bigint' })
  categoryId: number;
}
