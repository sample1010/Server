import { BaseController, CoolController } from '@cool-midway/core';
import { Provide } from '@midwayjs/decorator';
import { IPAgentEntity } from '../../entity/agent';
import { IpAgentService } from '../../service/app/agent';

/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: IPAgentEntity,
  service: IpAgentService,
})
export class IpAgentController extends BaseController { }
