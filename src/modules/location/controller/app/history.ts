import { BaseController, CoolController } from '@cool-midway/core';
import { Provide } from '@midwayjs/decorator';
import { IPHistoryEntity } from '../../entity/history';

/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: IPHistoryEntity,
})
export class IpInfoController extends BaseController { }
