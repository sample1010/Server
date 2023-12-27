import {
  BaseService,
  CoolCommException,
  CoolValidateException,
  RESCODE,
} from '@cool-midway/core';
import { CacheManager } from '@midwayjs/cache';
import { Config, Inject, Provide } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';

import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import * as md5 from 'md5';

import { BaseSysDepartmentEntity } from '../../entity/sys/department';
import { BaseSysRoleEntity } from '../../entity/sys/role';
import { BaseSysUserEntity } from '../../entity/sys/user';
import { BaseSysUserRoleEntity } from '../../entity/sys/user_role';
import { BaseSysDepartmentService } from '../sys/department';
import { BaseSysMenuService } from '../sys/menu';
import { BaseSysPermsService } from '../sys/perms';
import { BaseSysRoleService } from '../sys/role';
import { BaseSysUserService } from '../sys/user';

import { twilio } from '../../../../config/credentials';
import { BaseApiUserService } from './user';

/**
 * 登錄
 */
@Provide()
export class BaseAppAuthService extends BaseService {
  @Config('module.base')
  jwtConfig;

  @Inject()
  cacheManager: CacheManager;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysRoleEntity)
  baseSysRoleEntity: Repository<BaseSysRoleEntity>;

  @InjectEntityModel(BaseSysUserRoleEntity)
  baseSysUserRoleEntity: Repository<BaseSysUserRoleEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @Inject()
  baseSysUserService: BaseSysUserService;

  @Inject()
  baseApiUserService: BaseApiUserService;

  @Inject()
  baseSysRoleService: BaseSysRoleService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysDepartmentService: BaseSysDepartmentService;

  @Inject()
  ctx: Context;

  @Config('module.base')
  coolConfig;

  /**
   * 登錄
   * @param login
   */
  async login(login) {
    // rememberMe
    const { area, phone, password } = login;
    const user = await this.baseSysUserEntity.findOne({
      where: [{ area, phone }],
    });
    // 校驗用戶
    if (user) {
      // 校驗用戶狀態及密碼
      if (user.status === 0) {
        throw new CoolValidateException('該帳號已被禁用');
      }
      if (user.password !== md5(password)) {
        throw new CoolValidateException('手機或密碼不正確');
      }
    } else {
      throw new CoolCommException('該手機號碼尚未註冊');
    }
    // 校驗角色
    const roleIds = await this.baseSysRoleService.getByUser(user.id);
    if (_.isEmpty(roleIds)) {
      throw new CoolCommException('該用戶未分配任何角色，無法登錄');
    }

    // 生成token
    const { expire, refreshExpire } = this.coolConfig.jwt.token;
    const result = {
      expire,
      token: await this.generateToken(user, roleIds, expire),
      refreshExpire,
      refreshToken: await this.generateToken(
        user,
        roleIds,
        refreshExpire,
        true
      ),
    };

    // 將用戶相關信息保存到緩存
    const perms = await this.baseSysMenuService.getPerms(roleIds);
    const departments = await this.baseSysDepartmentService.getByRoleIds(
      roleIds,
      false
    );
    // return perms;
    await this.cacheManager.set(`user:department:${user.id}`, departments);
    await this.cacheManager.set(`user:perms:${user.id}`, perms);
    await this.cacheManager.set(`user:token:${user.id}`, result.token);
    await this.cacheManager.set(`user:token:refresh:${user.id}`, result.token);

    return result;
  }

  async person(id) {
    const info = await this.baseSysUserEntity.findOne({
      id: id,
    });

    if (_.isEmpty(info))
      throw new CoolCommException('未找到該用戶，請聯絡管理員');

    [
      'id',
      'username',
      'password',
      'passwordV',
      'createTime',
      'createBy',
      'updateTime',
      'updateBy',
      'deleteTime',
      'deleteBy',
      'status',
      'verify',
    ].forEach(e => delete info[e]);

    const { name: departmentName } = await this.baseSysDepartmentEntity.findOne(
      {
        id: info?.departmentId,
      }
    );
    delete info['departmentId'];
    return { ...info, departmentName };
  }

  /**
   * 註冊
   * @param register
   */
  async register(register) {
    const { area, phone, verifyCode, password, passwordConfirm } = register;

    if (this.ctx.user) throw new CoolCommException('請登出');

    const roleLabel = 'member';
    const departmentId = 13;
    const identityStatus = 24;
    const emailStatus = 17;

    // 驗證密碼長度
    const passwordLimit = 8;
    if (password.length < passwordLimit)
      throw new CoolCommException(`密碼長度最少需${passwordLimit}個字元`);

    // 校驗密碼
    if (!_.isEqual(password, passwordConfirm))
      throw new CoolValidateException('請確認輸入的密碼相同');

    // 校驗用戶
    const exists = await this.baseSysUserEntity.findOne({
      where: [{ phone }],
    });
    if (!_.isEmpty(exists)) throw new CoolCommException('該手機號碼已被使用');

    // 校驗驗證碼
    register.username = this.createRandomString(16);
    await this.captchaCheck(`${area}${register.phone}`, verifyCode);

    // 生成md5密碼
    register.password = md5(register.password);

    // 寫入資料庫
    // 儲存用戶資料
    const user = await this.baseSysUserEntity.save({
      ...register,
      identityStatus,
      emailStatus,
      departmentId,
      createBy: 1,
      updateBy: 1,
    });

    await this.baseSysUserEntity.save({
      id: user.id,
      createBy: user.id,
      updateBy: user.id,
    });
    const roleMember = await this.baseSysRoleEntity.findOne({
      label: roleLabel,
    });
    const roleIds = [roleMember.id];

    // 儲存用戶角色
    await this.baseSysUserRoleEntity.save({
      userId: user.id,
      roleId: roleMember.id,
    });
    await this.baseSysPermsService.refreshPerms(user.id);

    // 生成token提供前端登入
    const { expire, refreshExpire } = this.coolConfig.jwt.token;
    const result = {
      expire,
      token: await this.generateToken(user, roleIds, expire),
      refreshExpire,
      refreshToken: await this.generateToken(
        user,
        roleIds,
        refreshExpire,
        true
      ),
    };

    // 將用戶相關信息保存到緩存
    const perms = await this.baseSysMenuService.getPerms(roleIds);
    const departments = await this.baseSysDepartmentService.getByRoleIds(
      roleIds,
      false
    );
    await this.cacheManager.set(`user:department:${user.id}`, departments);
    await this.cacheManager.set(`user:perms:${user.id}`, perms);
    await this.cacheManager.set(`user:token:${user.id}`, result.token);
    await this.cacheManager.set(`user:token:refresh:${user.id}`, result.token);

    return result;
  }

  createRandomString(len: number) {
    let maxLen = 8,
      min = Math.pow(16, Math.min(len, maxLen) - 1),
      max = Math.pow(16, Math.min(len, maxLen)) - 1,
      n = Math.floor(Math.random() * (max - min + 1)) + min,
      r = n.toString(16);
    while (r.length < len) {
      r = r + this.createRandomString(len - maxLen);
    }
    return r;
  }

  /**
   * 忘記密碼
   */
  async forgot(forgot) {
    const { area, phone, verifyCode, password, passwordConfirm } = forgot;

    // 驗證密碼長度
    const passwordLimit = 8;
    if (password.length < passwordLimit)
      throw new CoolCommException(`密碼長度最少需${passwordLimit}個字元`);

    // 校驗密碼
    if (!_.isEqual(password, passwordConfirm))
      throw new CoolValidateException('請確認輸入的密碼相同');

    // 校驗用戶
    const user = await this.baseSysUserEntity.findOne({
      where: [{ phone }],
    });
    if (_.isEmpty(user)) throw new CoolCommException('該號碼尚未註冊');

    // 校驗驗證碼
    const areaPhone = area + phone.substring(1);
    await this.captchaCheck(`+${areaPhone}`, verifyCode);

    // 寫入資料庫
    forgot.password = md5(forgot.password);
    const passwordV = user.passwordV + 1;
    await this.baseSysUserEntity.save({ ...forgot, id: user.id, passwordV });

    // 生成token
    const { expire, refreshExpire } = this.coolConfig.jwt.token;
    const roleIds = await this.baseSysRoleService.getByUser(user.id);
    const result = {
      expire,
      token: await this.generateToken(user, roleIds, expire),
      refreshExpire,
      refreshToken: await this.generateToken(
        user,
        roleIds,
        refreshExpire,
        true
      ),
    };

    // 將用戶相關信息保存到緩存
    const perms = await this.baseSysMenuService.getPerms(roleIds);
    const departments = await this.baseSysDepartmentService.getByRoleIds(
      roleIds,
      false
    );
    // return perms;
    await this.cacheManager.set(`user:department:${user.id}`, departments);
    await this.cacheManager.set(`user:perms:${user.id}`, perms);
    await this.cacheManager.set(`user:token:${user.id}`, result.token);
    await this.cacheManager.set(`user:token:refresh:${user.id}`, result.token);

    return result;
  }

  /**
   * 發送手機驗證碼
   * @param captcha 國際區號
   */
  async captcha({ type, phone, area }) {
    // 驗證用戶手機號碼是否變更
    const userId = this.ctx.user?.userId;
    const user = await this.baseSysUserEntity.findOne({ id: userId });
    if (type === 'change' && !_.isEmpty(user) && user.phone === phone)
      throw new CoolCommException('與目前的號碼相同');

    // 驗證手機號碼是否已被使用
    const phoneExist = await this.baseSysUserEntity.findOne({ phone });
    if (type === 'register' && !_.isEmpty(phoneExist))
      throw new CoolCommException('該手機已被使用');

    // 發送驗證碼
    const areaPhone = `${area}${phone}`;

    const client = require('twilio')(twilio.accountSid, twilio.authToken);
    const result = client.verify.v2
      .services(twilio.verifySid)
      .verifications.create({
        to: areaPhone,
        channel: 'sms',
        locale: 'zh-HK',
      })
      .then(e => {
        console.log(e.sid);
        return true;
      })
      .catch(e => {
        console.log(e);
        throw new CoolCommException('無法送出驗證信，請聯絡管理員');
      });
    return result;
  }

  /**
   * 檢驗手機驗證碼
   * @param phone 手機號
   * @param value 驗證碼
   */
  async captchaCheck(areaPhone, smsCode) {
    const client = require('twilio')(twilio.accountSid, twilio.authToken);
    try {
      const valid = await client.verify.v2
        .services(twilio.verifySid)
        .verificationChecks.create({ to: areaPhone, code: smsCode })
        .then(verification_check => {
          return verification_check.valid;
        })
        .catch(() => false);
      return valid;
    } catch (e) {
      console.error(e);
      throw new CoolCommException('驗證碼不正確，請重新發送');
    }
  }

  /**
   * 生成token
   * @param user 用戶對象
   * @param roleIds 角色集合
   * @param expire 過期
   * @param isRefresh 是否是刷新
   */
  async generateToken(user, roleIds, expire, isRefresh?) {
    await this.cacheManager.set(
      `user:passwordVersion:${user.id}`,
      user.passwordV
    );
    const tokenInfo = {
      isRefresh: false,
      roleIds,
      username: user.username,
      userId: user.id,
      passwordVersion: user.passwordV,
    };
    if (isRefresh) {
      tokenInfo.isRefresh = true;
    }
    return jwt.sign(tokenInfo, this.coolConfig.jwt.secret, {
      expiresIn: expire,
    });
  }

  /**
   * 刷新token
   * @param token
   */
  async refreshToken({ refreshToken: token }) {
    try {
      const decoded = jwt.verify(token, this.coolConfig.jwt.secret);
      if (decoded && decoded['isRefresh']) {
        delete decoded['exp'];
        delete decoded['iat'];

        const { expire, refreshExpire } = this.coolConfig.jwt.token;
        decoded['isRefresh'] = false;
        const result = {
          expire,
          token: jwt.sign(decoded, this.coolConfig.jwt.secret, {
            expiresIn: expire,
          }),
          refreshExpire,
          refreshToken: '',
        };
        decoded['isRefresh'] = true;
        result.refreshToken = jwt.sign(decoded, this.coolConfig.jwt.secret, {
          expiresIn: refreshExpire,
        });
        await this.cacheManager.set(
          `user:passwordVersion:${decoded['userId']}`,
          decoded['passwordVersion']
        );
        return result;
      }
    } catch (err) {
      this.ctx.status = 401;
      this.ctx.body = {
        code: RESCODE.COMMFAIL,
        message: '自動登出，請重新登入',
      };
      return;
    }
  }
}
