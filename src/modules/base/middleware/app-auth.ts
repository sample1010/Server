import { App, Config, Inject, Middleware } from '@midwayjs/decorator';
import * as _ from 'lodash';
import * as jwt from 'jsonwebtoken';
import { NextFunction, Context } from '@midwayjs/koa';
import { IMiddleware, IMidwayApplication } from '@midwayjs/core';
import { CacheManager } from '@midwayjs/cache';

/**
 * 權限校驗
 */
@Middleware()
export class BaseAppAuthMiddleware
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
      const appUrl = '/app/';
      // 需驗證的路徑
      const authList = ['user', 'collection', 'tip', 'my'];
      const module = url.replace(appUrl, '').split('/')[0];
      const moduleAuth = _.some(authList, x => x === module);
      try {
        ctx.user = jwt.verify(token, this.jwtConfig.jwt.secret);
      } catch (err) { }

      // 路由地址為 app前綴的 權限校驗
      if (_.startsWith(url, appUrl)) {
        if (ctx.user) {
          // 不需要登錄 無需權限校驗
          if (new RegExp(`^${appUrl}?.*/auth/`).test(url)) {
            await next();
            return;
          }
          await next();
          return;
          // 如果傳的token是refreshToken則校驗失敗
          if (ctx.user.isRefresh) {
            ctx.status = 401;
            ctx.body = {
              code: 1005,
              message: '登錄失效',
            };
            return;
          }
          // 判斷密碼版本是否正確
          const passwordV = await this.cacheManager.get(
            `user:passwordVersion:${ctx.user.userId}`
          );
          if (passwordV != ctx.user.passwordVersion) {
            ctx.status = 401;
            ctx.body = {
              code: 1005,
              message: '登錄失效',
            };
            return;
          }
          const rToken = await this.cacheManager.get(
            `user:token:${ctx.user.userId}`
          );
          if (!rToken) {
            ctx.status = 401;
            ctx.body = {
              code: 1005,
              message: '登錄失效或無權限訪問',
            };
            return;
          }
          if (rToken !== token && this.jwtConfig.sso) {
            statusCode = 401;
          } else {
            // 角色權限校驗 - 待處理
            // let perms: string[] = await this.cacheManager.get(
            //   `user:perms:${ctx.user.userId}`
            // );
            // if (!_.isEmpty(perms)) {
            //   perms = perms.map(e => {
            //     return e.replace(/:/g, '/');
            //   });
            //   return perms;
            //   if (!perms.includes(url.split('?')[0].replace('/api/', ''))) {
            //     statusCode = 403;
            //   }
            // } else {
            //   statusCode = 403;
            // }
          }
        } else if (moduleAuth) {
          // 需要驗證且未登入
          ctx.status = 401;
          ctx.body = {
            code: 1005,
            message: '登錄失效或無權限訪問',
          };
          return;
        }
        if (statusCode > 200) {
          ctx.status = statusCode;
          ctx.body = {
            code: 1005,
            message: '登錄失效或無權限訪問',
          };
          return;
        }
      }
      await next();
    };
  }
}
