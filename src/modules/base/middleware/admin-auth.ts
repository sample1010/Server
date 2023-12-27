import { App, Config, Inject, Middleware } from '@midwayjs/decorator';
import * as _ from 'lodash';
import { RESCODE } from '@cool-midway/core';
import * as jwt from 'jsonwebtoken';
import { NextFunction, Context } from '@midwayjs/koa';
import { IMiddleware, IMidwayApplication } from '@midwayjs/core';
import { CacheManager } from '@midwayjs/cache';

/**
 * 權限校驗
 */
@Middleware()
export class BaseAdminAuthMiddleware
  implements IMiddleware<Context, NextFunction>
{
  @Config('koa.globalPrefix')
  prefix;

  @Config('module.base')
  jwtConfig;

  @Inject()
  cacheManager: CacheManager;

  @App()
  app: IMidwayApplication;

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      let statusCode = 200;
      let { url } = ctx;
      url = url.replace(this.prefix, '');
      const token = ctx.get('Authorization');
      const adminUrl = '/admin/';
      // 路由地址為 admin前綴的 需要權限校驗
      if (_.startsWith(url, adminUrl)) {
        try {
          ctx.admin = jwt.verify(token, this.jwtConfig.jwt.secret);
        } catch (err) {}
        // 不需要登錄 無需權限校驗
        if (new RegExp(`^${adminUrl}?.*/open/`).test(url)) {
          await next();
          return;
        }
        if (ctx.admin) {
          // 超管擁有所有權限
          if (ctx.admin.username == 'admin' && !ctx.admin.isRefresh) {
            await next();
            return;
          }
          // 要登錄每個人都有權限的接口
          if (new RegExp(`^${adminUrl}?.*/comm/`).test(url)) {
            await next();
            return;
          }
          // 如果傳的token是refreshToken則校驗失敗
          if (ctx.admin.isRefresh) {
            ctx.status = 401;
            ctx.body = {
              code: RESCODE.COMMFAIL,
              message: '登錄失效',
            };
            return;
          }
          // 判斷密碼版本是否正確
          const passwordV = await this.cacheManager.get(
            `admin:passwordVersion:${ctx.admin.userId}`
          );
          if (passwordV != ctx.admin.passwordVersion) {
            ctx.status = 401;
            ctx.body = {
              code: RESCODE.COMMFAIL,
              message: '登錄失效',
            };
            return;
          }
          const rToken = await this.cacheManager.get(
            `admin:token:${ctx.admin.userId}`
          );
          if (!rToken) {
            ctx.status = 401;
            ctx.body = {
              code: RESCODE.COMMFAIL,
              message: '登錄失效或無權限訪問',
            };
            return;
          }
          if (rToken !== token && this.jwtConfig.sso) {
            statusCode = 401;
          } else {
            let perms: string[] = await this.cacheManager.get(
              `admin:perms:${ctx.admin.userId}`
            );
            if (!_.isEmpty(perms)) {
              perms = perms.map(e => {
                return e.replace(/:/g, '/');
              });
              if (!perms.includes(url.split('?')[0].replace('/admin/', ''))) {
                statusCode = 403;
              }
            } else {
              statusCode = 403;
            }
          }
        } else {
          statusCode = 401;
        }
        if (statusCode > 200) {
          ctx.status = statusCode;
          ctx.body = {
            code: RESCODE.COMMFAIL,
            message: '登錄失效或無權限訪問',
          };
          return;
        }
      }
      await next();
    };
  }
}
