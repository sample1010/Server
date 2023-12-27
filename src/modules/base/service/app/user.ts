import { BaseService, CoolCommException } from '@cool-midway/core';
import { CacheManager } from '@midwayjs/cache';
import { Inject, Provide } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { InjectEntityModel } from '@midwayjs/orm';
import * as _ from 'lodash';
import * as md5 from 'md5';
import { Repository } from 'typeorm';
import { BaseSysDepartmentEntity } from '../../entity/sys/department';
import { BaseSysUserEntity } from '../../entity/sys/user';
import { BaseSysUserRoleEntity } from '../../entity/sys/user_role';

import { Utils } from '../../../../comm/utils';
import { googleMail } from '../../../../config/credentials';
import { TipAppService } from '../../../award/service/app/tips';
import { BaseUserIdentityEntity } from '../../../base/entity/sys/user_identity';
import { BaseAppAuthService } from './auth';

/**
 * 系統用戶
 */
@Provide()
export class BaseApiUserService extends BaseService {
  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysUserRoleEntity)
  baseSysUserRoleEntity: Repository<BaseSysUserRoleEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @InjectEntityModel(BaseUserIdentityEntity)
  userIdentityEntity: Repository<BaseUserIdentityEntity>;

  @Inject()
  tipAppService: Repository<TipAppService>;

  @Inject()
  baseAppAuthService: BaseAppAuthService;

  @Inject()
  cacheManager: CacheManager;

  @Inject()
  ctx: Context;

  @Inject()
  utils: Utils;

  /**
   * 獲得個人信息
   */
  async person() {
    // get 緩存
    const info = await this.baseSysUserEntity.findOne({
      id: this.ctx.user?.userId,
    });

    if (_.isEmpty(info))
      throw new CoolCommException('未找到該用戶，請聯絡管理員');

    [
      'password',
      'passwordV',
      'createTime',
      'createBy',
      'updateTime',
      'updateBy',
      'deleteTime',
      'deleteBy',
      'status',
      'socketId',
      'remark',
    ].forEach(e => delete info[e]);

    // const { name: departmentName } = await this.baseSysDepartmentEntity.findOne(
    //   {
    //     id: info?.departmentId,
    //   }
    // );
    // delete info['departmentId'];
    return { ...info };
  }

  /**
   * 修改
   * @param param 數據
   */
  async personUpdate(param) {
    if (_.isEmpty(param)) throw new CoolCommException('未輸入資料');

    const userId = this.ctx.user.userId;

    const user = await this.baseSysUserEntity.findOne({ id: userId });
    if (_.isEmpty(user)) throw new CoolCommException('用户不存在');

    const { firstName, lastName, intro, birthday, gender } = param;
    await this.baseSysUserEntity.save({
      firstName,
      lastName,
      intro,
      birthday,
      gender,
      id: userId,
    });
  }

  /**
   * 重設密碼
   */
  async resetPassword(reset) {
    const { oldPassword, newPassword, newPasswordConfirm } = reset;
    const userInfo = await this.baseSysUserEntity.findOne({
      id: this.ctx.user.userId,
    });
    const passwordLimit = 8;
    if (newPassword.length < passwordLimit)
      throw new CoolCommException(`密碼長度最少需${passwordLimit}個字元`);
    if (_.isEmpty(userInfo)) {
      throw new CoolCommException('用户不存在');
    }
    if (!_.isEqual(md5(oldPassword), userInfo.password)) {
      throw new CoolCommException('密碼輸入錯誤');
    }
    if (!_.isEqual(newPassword, newPasswordConfirm)) {
      throw new CoolCommException('兩次密碼輸入不一致');
    }
    if (_.isEqual(md5(newPassword), userInfo.password)) {
      throw new CoolCommException('與目前的密碼相同');
    }

    await this.baseSysUserEntity.save({
      id: this.ctx.user.userId,
      password: md5(reset.newPassword),
      passwordV: userInfo.passwordV + 1,
    });
  }

  /**
   * 根據ID獲得信息
   * @param id
   */
  public async info(id) {
    const info = await this.baseSysUserEntity.findOne({ id });
    if (_.isEmpty(info)) throw new CoolCommException('找不到這個人');

    // const userRoles = await this.nativeQuery(
    //   'select a.roleId from base_sys_user_role a where a.userId = ?',
    //   [id]
    // );
    // const department = await this.baseSysDepartmentEntity.findOne({
    //   id: info.departmentId,
    // });
    // if (info) {
    //   delete info.password;
    //   if (userRoles) {
    //     info.roleIdList = userRoles.map(e => {
    //       return parseInt(e.roleId);
    //     });
    //   }
    // }
    // delete info.password;
    // if (department) {
    //   info.departmentName = department.name;
    // }
    return info;
  }

  /**
   * 刪除帳戶
   */
  public async delete() {
    const userId = this.ctx.user.userId;

    const user = await this.baseSysUserEntity.findOne({ id: userId });
    if (user) {
      await this.baseSysUserEntity.save({
        id: userId,
        deleteBy: this.ctx.user.userId,
        deleteTime: new Date(),
        status: 1,
      });

      await this.cacheManager.del(`user:department:${userId}`);
      await this.cacheManager.del(`user:perms:${userId}`);
      await this.cacheManager.del(`user:token:${userId}`);
      await this.cacheManager.del(`user:token:refresh:${userId}`);
    } else {
      throw new CoolCommException('用戶不存在');
    }
  }

  /**
   * 綁定Email
   */
  public async emailBinding(param) {
    const { email } = param;

    const nodemailer = require('nodemailer');
    const baseUrl = 'http://bondingtechs.com/my/account/email-verify?token=';
    const token = this.utils.randomString(50);
    const confirmUrl = baseUrl + token;

    const emailUser = await this.baseSysUserEntity.findOne({
      email,
    });

    if (!_.isEmpty(emailUser) && emailUser.emailStatus === 20)
      throw new CoolCommException('該Email已被使用');

    const userInfo = await this.baseSysUserEntity.findOne({
      id: this.ctx.user.userId,
    });

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: googleMail.user,
        pass: googleMail.pass,
      },
    });

    let mailOptions = {
      from: 'zz02846584zz@gmail.com',
      to: email,
      subject: 'Bonding 鍵結科技 - 帳號綁定驗證', // Subject line
      //純文字
      // text: 'Hello world2', // plaintext body
      //嵌入 html 的內文
      html: `<div class="">
      <div class="aHl"></div>
      <div id=":1pq" tabindex="-1"></div>
      <div
        id=":1v4"
        class="ii gt"
        jslog="20277; u014N:xr6bB; 4:W251bGwsbnVsbCxbXV0."
      >
        <div id=":1tl" class="a3s aiL">
          <u></u>

          <div
            style="
              font-family: 'Helvetica Neue', Helvetica, 'PingFang TC',
                'Microsoft JhengHei', 'PMingLiU', sans-serif;
              line-height: inherit;
              margin: 0;
              padding: 0;
            "
            bgcolor="#fafafa"
          >
            <table
              style="
                border-collapse: collapse;
                table-layout: fixed;
                border-spacing: 0;
                vertical-align: top;
                min-width: 320px;
                width: 100%;
                line-height: inherit;
                margin: 0 auto;
              "
              cellpadding="0"
              cellspacing="0"
              bgcolor="#fafafa"
            >
              <tbody style="line-height: inherit">
                <tr
                  style="
                    vertical-align: top;
                    border-collapse: collapse;
                    line-height: inherit;
                  "
                >
                  <td
                    style="
                      word-break: break-word;
                      border-collapse: collapse !important;
                      line-height: inherit;
                    "
                    valign="top"
                  >
                    <div
                      style="background-color: transparent; line-height: inherit"
                    >
                      <div
                        style="
                          min-width: 320px;
                          max-width: 540px;
                          word-wrap: break-word;
                          word-break: break-word;
                          background-color: transparent;
                          line-height: inherit;
                          margin: 0 auto;
                        "
                      >
                        <div
                          style="
                            border-collapse: collapse;
                            display: table;
                            width: 100%;
                            background-color: transparent;
                            line-height: inherit;
                          "
                        >
                          <div
                            style="
                              min-width: 320px;
                              max-width: 540px;
                              display: table-cell;
                              vertical-align: top;
                              line-height: inherit;
                            "
                          >
                            <div
                              style="
                                background-color: transparent;
                                width: 100% !important;
                                line-height: inherit;
                              "
                            >
                              <div
                                style="
                                  line-height: inherit;
                                  padding: 36px 0px 20px;
                                  border: 0px solid transparent;
                                "
                              >
                                <div
                                  align="center"
                                  style="
                                    padding-right: 0px;
                                    padding-left: 0px;
                                    line-height: inherit;
                                  "
                                >

                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      style="background-color: transparent; line-height: inherit"
                    >
                      <div
                        style="
                          min-width: 320px;
                          max-width: 540px;
                          word-wrap: break-word;
                          word-break: break-word;
                          background-color: #ffffff;
                          border-bottom-width: 2px;
                          border-bottom-color: #efefef;
                          border-bottom-style: solid;
                          line-height: inherit;
                          margin: 0 auto;
                        "
                      >
                        <div
                          style="
                            border-collapse: collapse;
                            display: table;
                            width: 100%;
                            background-color: #ffffff;
                            line-height: inherit;
                          "
                        >
                          <div
                            style="
                              min-width: 320px;
                              max-width: 540px;
                              display: table-cell;
                              vertical-align: top;
                              line-height: inherit;
                            "
                          >
                            <div
                              style="
                                background-color: transparent;
                                width: 100% !important;
                                line-height: inherit;
                              "
                            >
                              <div
                                style="
                                  line-height: inherit;
                                  padding: 5px 0px;
                                  border: 1px solid #efefef;
                                "
                              >
                                <div
                                  style="
                                    color: #333;
                                    line-height: 120%;
                                    padding: 30px;
                                  "
                                >
                                  <div
                                    style="font-size: 14px; line-height: 1.42857143"
                                    align="left"
                                  >
                                    <h1
                                      style="
                                        line-height: 1.1;
                                        font-weight: 500;
                                        font-size: 24px;
                                        margin-top: 0;
                                      "
                                    >
                                      你好 ${userInfo.firstName} ${userInfo.lastName}!
                                    </h1>
                                    <p style="line-height: 1.5">
                                    您可以通過下面的鏈接按鈕 <span class="il">確認</span> 您的帳戶電子郵件。
                                    </p>
                                    <div
                                      style="
                                        line-height: inherit;
                                        margin: 30px auto 14px;
                                      "
                                      align="center"
                                    >
                                      <a
                                        href="${confirmUrl}"
                                        style="
                                          display: inline-block;
                                          color: #fff;
                                          background-color: #13ab67;
                                          border-radius: 3px;
                                          text-align: center;
                                          text-decoration: none;
                                          font-size: 16px;
                                          line-height: inherit;
                                          padding: 14px 30px;
                                        "
                                        target="_blank"
                                        ><span class="il">確認</span> Email</a
                                      >
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      style="background-color: transparent; line-height: inherit"
                    >
                      <div
                        style="
                          min-width: 320px;
                          max-width: 540px;
                          word-wrap: break-word;
                          word-break: break-word;
                          background-color: transparent;
                          line-height: inherit;
                          margin: 0 auto;
                        "
                      >
                        <div
                          style="
                            border-collapse: collapse;
                            display: table;
                            width: 100%;
                            background-color: transparent;
                            line-height: inherit;
                          "
                        >
                          <div
                            style="
                              min-width: 320px;
                              max-width: 540px;
                              display: table-cell;
                              vertical-align: top;
                              line-height: inherit;
                            "
                          >
                            <div
                              style="
                                background-color: transparent;
                                width: 100% !important;
                                line-height: inherit;
                              "
                            >
                              <div
                                style="
                                  line-height: inherit;
                                  padding: 5px 0px;
                                  border: 0px solid transparent;
                                "
                              >
                                <div
                                  style="
                                    font-size: 12px;
                                    color: #aaa;
                                    line-height: inherit;
                                    padding: 10px;
                                  "
                                  align="center"
                                >
                                  您收到這封電子郵件是因為您已在 鍵結科技 申請綁定Email
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="yj6qo"></div>
          <div class="adL"></div>
        </div>
      </div>
      <div id=":1pu" class="ii gt" style="display: none">
        <div id=":1pv" class="a3s aiL"></div>
      </div>
      <div class="hi"></div>
    </div>`,
    };

    return transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
        if (!_.isEmpty(emailUser)) {
          await this.baseSysUserEntity.save({
            id: emailUser.id,
            emailStatus: 17,
            email: null,
          });
        }

        await this.baseSysUserEntity.save({
          id: this.ctx.user.userId,
          emailStatus: 18,
          email: email,
        });

        await this.cacheManager.set(
          `user:emailToken:${token}`,
          this.ctx.user.userId
        );

        return confirmUrl;
      }
    });
  }

  /**
   * 驗證Email
   */
  public async emailVerify({ token }) {
    const userId: number = await this.cacheManager.get(
      `user:emailToken:${token}`
    );

    if (!userId) throw new CoolCommException('驗證失敗，請重新填寫Email');

    await this.baseSysUserEntity.save({
      id: userId,
      emailStatus: 20,
    });
  }

  /**
   * 更換手機
   */
  public async changePhone({ area, phone, verifyCode }) {
    // 驗證
    const phoneWithArea = area + phone.substring(1);
    await this.baseAppAuthService.captchaCheck(`+${phoneWithArea}`, verifyCode);

    // 更新電話
    const userId = this.ctx.user.userId;
    const result = await this.baseSysUserEntity.save({ id: userId, phone });
    return result;
  }

  /**
   * 登出
   */
  async logout() {
    const user = this.ctx.user;
    if (!user) throw new CoolCommException('用戶未登入');
    const userId = user.userId;
    await this.cacheManager.del(`user:department:${userId}`);
    await this.cacheManager.del(`user:perms:${userId}`);
    await this.cacheManager.del(`user:token:${userId}`);
    await this.cacheManager.del(`user:token:refresh:${userId}`);
  }
}
