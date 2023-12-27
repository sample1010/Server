import { BaseService, CoolCommException } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import * as _ from 'lodash';
import { Repository } from 'typeorm';
import { BaseSysUserEntity } from '../../../base/entity/sys/user';
import { BaseUserIdentityEntity } from '../../entity/sys/user_identity';
/**
 * 描述
 */
@Provide()
export class UserIdentityService extends BaseService {
  @InjectEntityModel(BaseUserIdentityEntity)
  userIdentityEntity: Repository<BaseUserIdentityEntity>;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @Inject()
  ctx;

  /**
   * 描述
   */
  async identityCert(param) {
    const userId = this.ctx.user.userId;
    const exist = await this.userIdentityEntity.findOne({ userId });
    if (_.isEmpty(exist)) {
      await this.userIdentityEntity.save({
        userId,
        ...param,
        createBy: userId,
        updateBy: userId,
      });
    } else {
      await this.userIdentityEntity.save({
        id: exist.id,
        ...param,
        updateBy: userId,
      });
    }
  }

  /**
   * 身份驗證
   */
  public async identityVerify(params) {
    const { idCard, positiveId } = params;
    if (_.isEmpty(idCard) || !positiveId)
      throw new CoolCommException('請輸入完整參數');

    const idCardExist = await this.baseSysUserEntity.findOne({
      idCard,
      identityStatus: 23,
    });
    if (!_.isEmpty(idCardExist))
      throw new CoolCommException('該身份證已被使用，請聯絡管理員');

    const userId = this.ctx.user.userId;
    const identityExist = await this.userIdentityEntity.findOne({ userId });
    if (!_.isEmpty(identityExist)) {
      await this.userIdentityEntity.save({
        id: identityExist.id,
        userId,
        idCard,
        positiveId,
        // negativeId,
        createBy: userId,
        updateBy: userId,
      });
    } else {
      await this.userIdentityEntity.save({
        userId,
        idCard,
        positiveId,
        // negativeId,
        createBy: userId,
        updateBy: userId,
      });
    }
    await this.baseSysUserEntity.save({
      id: userId,
      idCard,
      identityStatus: 21,
    });
  }
}
