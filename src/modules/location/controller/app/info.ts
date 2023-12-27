import { BaseController, CoolController } from '@cool-midway/core';
import { Provide } from '@midwayjs/decorator';
import { IPInfoEntity } from '../../entity/info';
import { IPInfoService } from '../../service/app/info';

/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: IPInfoEntity,
  service: IPInfoService,
})
export class IpInfoController extends BaseController {
  // @Inject()
  // ipInfoService: IPInfoService;
}
