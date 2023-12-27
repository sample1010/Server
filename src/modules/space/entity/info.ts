import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 文件空間信息
 */
@EntityModel('space_info')
export class SpaceInfoEntity extends BaseEntity {
  @Column({ comment: '地址' })
  url: string;

  @Column({ comment: '類型' })
  type: string;

  @Column({ comment: '分類ID', type: 'bigint', nullable: true })
  classifyId: number;
}
