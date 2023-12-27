import { BaseEntity } from '@cool-midway/core';
import { EntityModel } from '@midwayjs/orm';
import { Column } from 'typeorm';

/**
 * 描述
 */
@EntityModel('external_link_click')
export class LinkClickEntity extends BaseEntity {
  @Column({ comment: 'Info ID' })
  infoId: number;

  @Column({ comment: 'User ID', nullable: true })
  userId: number;
}
