import { BaseService } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import { Context } from '@midwayjs/socketio';
import { Repository } from 'typeorm';
import { IPHistoryEntity } from '../../entity/history';

/**
 * 描述
 */
@Provide()
export class IPHistoryService extends BaseService {
  @InjectEntityModel(IPHistoryEntity)
  ipHistoryEntity: Repository<IPHistoryEntity>;

  @Inject()
  ctx: Context;
}
