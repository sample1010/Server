import { BaseEntity } from '@cool-midway/core';
import { EntityModel } from '@midwayjs/orm';
import { Column } from 'typeorm';

/**
 * 字典信息
 */
@EntityModel('ip_history')
export class IPHistoryEntity extends BaseEntity {
  @Column({ comment: '設備ID' })
  agentId: number;

  @Column({ comment: '頁面路由' })
  routeFrom: string;

  @Column({ comment: '頁面路由' })
  routeTo: string;
}
