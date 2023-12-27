import { BaseEntity } from '@cool-midway/core';
import { EntityModel } from '@midwayjs/orm';
import { Column } from 'typeorm';

@EntityModel('award_tips_collection')
export class AwardTipsCollectionEntity extends BaseEntity {
  @Column({ comment: '小知識ID', type: 'bigint' })
  tipId: number;

  @Column({ comment: '用戶ID', type: 'bigint' })
  userId: number;
}
