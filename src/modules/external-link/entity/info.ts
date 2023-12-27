import { BaseEntity } from '@cool-midway/core';
import { EntityModel } from '@midwayjs/orm';
import { Column } from 'typeorm';

/**
 * 描述
 */
@EntityModel('external_link_info')
export class LinkInfoEntity extends BaseEntity {
  @Column({ comment: '連結' })
  href: string;
}
