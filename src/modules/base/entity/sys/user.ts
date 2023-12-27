import { BaseEntity } from '@cool-midway/core';
import { EntityModel } from '@midwayjs/orm';
import { Column, Index } from 'typeorm';

/**
 * 系統用戶
 */
@EntityModel('base_sys_user')
export class BaseSysUserEntity extends BaseEntity {
  @Index()
  @Column({ comment: '部門ID', type: 'bigint', default: 1, nullable: true })
  departmentId: number;

  @Column({ comment: 'socketId', nullable: true })
  socketId: string;

  @Index({ unique: true })
  @Column({ comment: '用戶名', length: 100 })
  username: string;

  @Column({ comment: '密碼' })
  password: string;

  @Column({
    comment: '密碼版本, 作用是改完密碼，讓原來的token失效',
    default: 1,
  })
  passwordV: number;

  @Column({ comment: '頭像', nullable: true })
  avatar: string;

  @Column({ comment: '姓氏' })
  firstName: string;

  @Column({ comment: '名字' })
  lastName: string;

  @Column({ comment: '性別 0:男 1:女', default: 1, type: 'tinyint' })
  gender: number;

  @Column({ comment: '生日', nullable: true })
  birthday: string;

  @Column({ comment: '區碼', default: '+886', length: 20 })
  area: string;

  @Index({ unique: true })
  @Column({ comment: '手機', nullable: true, length: 20 })
  phone: string;

  @Index({ unique: true })
  @Column({ comment: 'Email', nullable: true })
  email: string;

  @Index({ unique: true })
  @Column({ comment: '身分證字號', nullable: true })
  idCard: string;

  @Column({ comment: '身份驗證 dict:審核中.駁回.通過', type: 'tinyint' })
  identityStatus: number;

  @Column({ comment: '駁回原因', nullable: true, type: 'text' })
  rejectReason: string;

  @Column({ comment: '簡介', nullable: true, type: 'mediumtext' })
  intro: string;

  @Column({ comment: '備註', nullable: true })
  remark: string;

  @Column({
    comment: 'Email驗證',
    type: 'tinyint',
  })
  emailStatus: number;

  @Column({ comment: '狀態 0:禁用 1:啟用', default: 1, type: 'tinyint' })
  status: number;

  // 部門名稱
  departmentName: string;

  // 角色ID列表
  roleIdList: number[];
}
