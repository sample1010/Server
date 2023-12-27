import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 角色部門
 */
@EntityModel('base_sys_role_department')
export class BaseSysRoleDepartmentEntity extends BaseEntity {
  @Column({ comment: '角色ID', type: 'bigint' })
  roleId: number;

  @Column({ comment: '部門ID', type: 'bigint' })
  departmentId: number;
}
