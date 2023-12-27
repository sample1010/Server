import { BaseController, CoolController } from '@cool-midway/core';
import { Provide } from '@midwayjs/decorator';
import { LinkClickEntity } from '../../entity/click';
import { LinkClickService } from '../../service/app/click';

/**
 * 描述
 */
@Provide()
@CoolController({
  prefix: '/app/external-link',
  api: ['add'],
  entity: LinkClickEntity,
  service: LinkClickService,
})
export class IpInfoController extends BaseController {
  //
}
