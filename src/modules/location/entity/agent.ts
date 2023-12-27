import { BaseEntity } from '@cool-midway/core';
import { EntityModel } from '@midwayjs/orm';
import { Column } from 'typeorm';

/**
 * 字典信息
 */
@EntityModel('ip_agent')
export class IPAgentEntity extends BaseEntity {
  @Column({ comment: 'IP Info ID' })
  infoId: number;

  @Column({ comment: 'userAgentString' })
  userAgentString: string;

  @Column({ comment: 'name' })
  name: string;

  @Column({ comment: 'type' })
  type: string;

  @Column({ comment: 'version' })
  version: string;

  @Column({ comment: 'versionMajor' })
  versionMajor: string;

  @Column({ comment: 'device' })
  device: string;

  @Column({ comment: 'engine' })
  engine: string;

  @Column({ comment: 'operatingSystem' })
  operatingSystem: string;
}
