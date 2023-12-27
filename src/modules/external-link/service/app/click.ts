import { BaseService } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import { Context } from 'koa';
import * as _ from 'lodash';
import { Repository } from 'typeorm';
import { LinkClickEntity } from '../../entity/click';
import { LinkInfoEntity } from '../../entity/info';

/**
 * 描述
 */
@Provide()
export class LinkClickService extends BaseService {
  @InjectEntityModel(LinkInfoEntity)
  linkInfoEntity: Repository<LinkInfoEntity>;

  @InjectEntityModel(LinkClickEntity)
  linkClickEntity: Repository<LinkClickEntity>;

  @Inject()
  ctx: Context;

  async add(param) {
    let userId = null;
    if (this.ctx.user) {
      userId = this.ctx.user.userId;
    }
    const info = await this.linkInfoEntity.findOne({ href: param.href });

    if (_.isEmpty(info)) {
      const info = await this.linkInfoEntity.save({ href: param.href });
      return await this.linkClickEntity.save({
        infoId: info.id,
        userId,
      });
    } else {
      return await this.linkClickEntity.save({
        infoId: info.id,
        userId,
      });
    }
  }
}
