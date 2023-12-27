import { BaseService } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import { Context } from 'koa';
import * as _ from 'lodash';
import { Repository } from 'typeorm';
import { IPInfoEntity } from '../../entity/info';

/**
 * 描述
 */
@Provide()
export class IPInfoService extends BaseService {
  @InjectEntityModel(IPInfoEntity)
  ipInfoEntity: Repository<IPInfoEntity>;

  @Inject()
  ctx: Context;

  async add(param) {
    let userId = null;
    if (this.ctx.user) {
      userId = this.ctx.user.userId;
    }
    const info = await this.ipInfoEntity.findOne({ ip: param.ip });

    if (_.isEmpty(info)) {
      return await this.ipInfoEntity.save({
        ...param,
      });
    }

    if (!userId) return info;

    const userIpInfo = await this.ipInfoEntity.findOne({
      ip: param.ip,
      userId,
    });

    if (!_.isEmpty(userIpInfo)) return userIpInfo;

    return await this.ipInfoEntity.save({
      id: info.id,
      ...param,
      userId,
    });
  }
}
