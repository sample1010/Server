import { BaseService, CoolCommException, RESCODE } from '@cool-midway/core';
import { CacheManager } from '@midwayjs/cache';
import { Config, Inject, Provide } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { InjectEntityModel } from '@midwayjs/orm';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import * as md5 from 'md5';
import * as svgToDataURL from 'mini-svg-data-uri';
import * as svgCaptcha from 'svg-captcha';
import { Repository } from 'typeorm';
import { v1 as uuid } from 'uuid';
import { LoginDTO } from '../../dto/login';
import { BaseSysUserEntity } from '../../entity/sys/user';
import { BaseSysDepartmentService } from './department';
import { BaseSysMenuService } from './menu';
import { BaseSysRoleService } from './role';

/**
 * 登錄
 */
@Provide()
export class BaseSysLoginService extends BaseService {
  @Inject()
  cacheManager: CacheManager;

  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @Inject()
  baseSysRoleService: BaseSysRoleService;

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
  async login(login: LoginDTO) {
    const { username, captchaId, verifyCode, password } = login;
    // 校驗驗證碼
    const checkV = await this.captchaCheck(captchaId, verifyCode);
    if (checkV) {
      console.log('login >>> ', checkV);
      const user = await this.baseSysUserEntity.findOne({ username });
      // 校驗用戶
      if (user) {
        // 校驗用戶狀態及密碼
        if (user.status === 0 || user.password !== md5(password)) {
          console.log(user);
          throw new CoolCommException('賬戶或密碼不正確~');
        }
      } else {
        throw new CoolCommException('賬戶或密碼不正確~');
      }
      // 校驗角色
      const roleIds = await this.baseSysRoleService.getByUser(user.id);
      if (_.isEmpty(roleIds)) {
        throw new CoolCommException('該用戶未設置任何角色，無法登錄~');
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
        user.username === 'admin'
      );
      await this.cacheManager.set(`admin:department:${user.id}`, departments);
      await this.cacheManager.set(`admin:perms:${user.id}`, perms);
      await this.cacheManager.set(`admin:token:${user.id}`, result.token);
      await this.cacheManager.set(
        `admin:token:refresh:${user.id}`,
        result.token
      );

      return result;
    } else {
      throw new CoolCommException('驗證碼不正確');
    }
  }

  /**
   * 驗證碼
   * @param type 圖片驗證碼類型 svg
   * @param width 寬
   * @param height 高
   */
  async captcha(type: string, width = 150, height = 50) {
    const svg = svgCaptcha.create({
      ignoreChars: 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM',
      width,
      height,
    });
    const result = {
      captchaId: uuid(),
      data: svg.data.replace(/"/g, "'"),
    };
    // 文字變白
    const rpList = [
      '#111',
      '#222',
      '#333',
      '#444',
      '#555',
      '#666',
      '#777',
      '#888',
      '#999',
    ];
    rpList.forEach(rp => {
      result.data = result.data['replaceAll'](rp, '#fff');
    });
    if (type === 'base64') {
      result.data = svgToDataURL(result.data);
    }
    // 半小時過期
    await this.cacheManager.set(
      `verify:img:${result.captchaId}`,
      svg.text.toLowerCase(),
      { ttl: 1800 }
    );
    return result;
  }

  /**
   * 退出登錄
   */
  async logout() {
    const { userId } = this.ctx.admin;
    await this.cacheManager.del(`admin:department:${userId}`);
    await this.cacheManager.del(`admin:perms:${userId}`);
    await this.cacheManager.del(`admin:token:${userId}`);
    await this.cacheManager.del(`admin:token:refresh:${userId}`);
  }

  /**
   * 檢驗圖片驗證碼
   * @param captchaId 驗證碼ID
   * @param value 驗證碼
   */
  async captchaCheck(captchaId, value) {
    const rv = await this.cacheManager.get(`verify:img:${captchaId}`);
    if (!rv || !value || value.toLowerCase() !== rv) {
      return false;
    } else {
      this.cacheManager.del(`verify:img:${captchaId}`);
      return true;
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
      `admin:passwordVersion:${user.id}`,
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
  async refreshToken(token: string) {
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
          `admin:passwordVersion:${decoded['userId']}`,
          decoded['passwordVersion']
        );
        await this.cacheManager.set(
          `admin:token:${decoded['userId']}`,
          result.token
        );
        return result;
      }
    } catch (err) {
      console.log(err);
      this.ctx.status = 401;
      this.ctx.body = {
        code: RESCODE.COMMFAIL,
        message: '登錄失效~',
      };
      return;
    }
  }
}
