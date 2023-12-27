import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 字典類別
 */
@EntityModel('dict_type')
export class DictTypeEntity extends BaseEntity {
  @Column({ comment: '名稱' })
  name: string;

  @Column({ comment: '標識' })
  key: string;
}
