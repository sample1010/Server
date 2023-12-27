import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 字典信息
 */
@EntityModel('dict_info')
export class DictInfoEntity extends BaseEntity {
  @Column({ comment: '類型ID' })
  typeId: number;

  @Column({ comment: '名稱' })
  name: string;

  @Column({ comment: '排序', default: 0 })
  orderNum: number;

  @Column({ comment: '類型 el-tag', nullable: true })
  type: string;

  @Column({ comment: '備註', nullable: true })
  remark: string;

  @Column({ comment: '父ID', default: null })
  parentId: number;
}
