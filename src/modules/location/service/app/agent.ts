import { BaseService } from '@cool-midway/core';
import { Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import * as _ from 'lodash';
import { Repository } from 'typeorm';
import { IPAgentEntity } from '../../entity/agent';

/**
 * 描述
 */
@Provide()
export class IpAgentService extends BaseService {
  @InjectEntityModel(IPAgentEntity)
  ipAgentEntity: Repository<IPAgentEntity>;

  async add(param) {
    const agent = await this.ipAgentEntity.findOne({
      infoId: param.infoId,
      userAgentString: param.userAgentString,
      name: param.name,
    });
    if (!_.isEmpty(agent)) {
      return agent;
    }
    return await this.ipAgentEntity.save({
      ...param,
    });
  }
}
