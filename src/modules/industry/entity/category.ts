import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * 描述
 */
@EntityModel('industry_category')
export class IndustryCategoryEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '分類名稱' })
  name: string;

  @Index({ unique: true })
  @Column({ comment: '分類代稱' })
  slug: string;

  @Column({ comment: '分類描述', nullable: true })
  description: string;

  @Column({ comment: '上層分類', nullable: true })
  parentId: number;

  @Column({ comment: 'Icon', nullable: true })
  icon: string;

  @Column({ comment: '排序號', nullable: true })
  orderNum: number;

  tipCount: number;
  articleCount: number;
}
