import { BaseEntity } from '@cool-midway/core';
import { EntityModel } from '@midwayjs/orm';
import { Column } from 'typeorm';

/**
 * 字典信息
 */
@EntityModel('ip_info')
export class IPInfoEntity extends BaseEntity {
  @Column({ comment: 'IP地址' })
  ip: string;

  @Column({ comment: '國家' })
  country: string;

  @Column({ comment: '縣/市' })
  city: string;

  @Column({ comment: '區' })
  district: string;

  @Column({ comment: '經度' })
  latitude: string;

  @Column({ comment: '緯度' })
  longitude: string;

  @Column({ comment: '時區' })
  timezone: string;

  @Column({ comment: '用戶ID', nullable: true })
  userId: number;
}
