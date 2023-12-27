import { EntityModel } from '@midwayjs/orm';
import { Column, Index } from 'typeorm';
import { BaseEventEntity } from '../../../../base/entity/baseEvent';

/**
 * 描述
 */
@EntityModel('base_sys_user_identity')
export class BaseUserIdentityEntity extends BaseEventEntity {
  @Index({ unique: true })
  @Column({ comment: '用戶ID' })
  userId: number;

  @Column({ comment: '正面照ID' })
  positiveId: number;

  // @Column({ comment: '背面照ID' })
  // negativeId: number;
}
