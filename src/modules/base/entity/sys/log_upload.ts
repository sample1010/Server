import { EntityModel } from '@midwayjs/orm';
import { Column } from 'typeorm';
import { BaseEventEntity } from '../../../../base/entity/baseEvent';

/**
 * 描述
 */
@EntityModel('base_sys_log_upload')
export class BaseSysLogUploadEntity extends BaseEventEntity {
  @Column({ comment: '地址' })
  url: string;
}
