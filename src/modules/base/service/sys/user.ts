import { BaseService, CoolCommException } from '@cool-midway/core';
import { CacheManager } from '@midwayjs/cache';
import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import * as _ from 'lodash';
import * as md5 from 'md5';
import { Repository } from 'typeorm';
import { BaseSysDepartmentEntity } from '../../entity/sys/department';
import { BaseSysLogUploadEntity } from '../../entity/sys/log_upload';
import { BaseSysUserEntity } from '../../entity/sys/user';
import { BaseUserIdentityEntity } from '../../entity/sys/user_identity';
import { BaseSysUserRoleEntity } from '../../entity/sys/user_role';
import { BaseSysPermsService } from './perms';

/**
 * 系統用戶
 */
@Provide()
export class BaseSysUserService extends BaseService {
  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysUserRoleEntity)
  baseSysUserRoleEntity: Repository<BaseSysUserRoleEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @InjectEntityModel(BaseUserIdentityEntity)
  baseUserIdentityEntity: Repository<BaseUserIdentityEntity>;

  @InjectEntityModel(BaseSysLogUploadEntity)
  baseSysLogUploadEntity: Repository<BaseSysLogUploadEntity>;

  @Inject()
  cacheManager: CacheManager;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  /**
   * 分頁查詢
   * @param query
   */
  async page(query) {
    const { keyWord, status, departmentIds = [] } = query;
    // const permsDepartmentArr = await this.baseSysPermsService.departmentIds(
    //   this.ctx.admin.userId
    // ); // 部門權限
    const sql = `
        SELECT
            a.id,
            concat(a.firstName, ' ', a.lastName) As name,
            a.username,
            a.avatar,
            a.email,
            a.remark,
            a.createTime,
            a.updateTime,
            a.phone,
            a.departmentId,
            a.status,
            a.identityStatus,
            a.emailStatus,
            GROUP_CONCAT(c.name) AS roleName,
            d.name as departmentName
        FROM
            base_sys_user a
            LEFT JOIN base_sys_user_role b ON a.id = b.userId
            LEFT JOIN base_sys_role c ON b.roleId = c.id
            LEFT JOIN base_sys_department d ON a.departmentId = d.id
            LEFT JOIN base_sys_user_identity e ON a.id = e.userId
        WHERE 1 = 1
            ${this.setSql(
      !_.isEmpty(departmentIds),
      'and a.departmentId in (?)',
      [departmentIds]
    )}
            ${this.setSql(status, 'and a.status = ?', [status])}
            ${this.setSql(keyWord, 'and (a.name LIKE ? or a.username LIKE ?)', [
      `%${keyWord}%`,
      `%${keyWord}%`,
    ])}
            ${this.setSql(true, 'and a.username != ?', ['admin'])}
        GROUP BY a.id
        `;
    return this.sqlRenderPage(sql, query);
  }

  //         ${this.setSql(
  //   this.ctx.admin.username !== 'admin',
  //   'and a.departmentId in (?)',
  //   [!_.isEmpty(permsDepartmentArr) ? permsDepartmentArr : [null]]
  // )}

  /**
   * 移動部門
   * @param departmentId
   * @param userIds
   */
  async move(departmentId, userIds) {
    await this.baseSysUserEntity
      .createQueryBuilder()
      .update()
      .set({ departmentId })
      .where('id in (:userIds)', { userIds })
      .execute();
  }

  /**
   * 獲得個人信息
   */
  async person() {
    const info = await this.baseSysUserEntity.findOne({
      id: this.ctx.admin?.userId,
    });
    delete info?.password;
    return info;
  }

  /**
   * 更新用戶角色關係
   * @param user
   */
  async updateUserRole(user) {
    if (_.isEmpty(user.roleIdList)) {
      return;
    }
    if (user.username === 'admin') {
      throw new CoolCommException('非法操作~');
    }
    await this.baseSysUserRoleEntity.delete({ userId: user.id });
    if (user.roleIdList) {
      for (const roleId of user.roleIdList) {
        await this.baseSysUserRoleEntity.save({ userId: user.id, roleId });
      }
    }
    await this.baseSysPermsService.refreshPerms(user.id);
  }

  /**
   * 新增
   * @param param
   */
  async add(param) {
    const exists = await this.baseSysUserEntity.findOne({
      username: param.username,
    });
    if (!_.isEmpty(exists)) {
      throw new CoolCommException('用戶名已存在');
    }
    param.password = md5(param.password);
    await this.baseSysUserEntity.save(param);
    await this.updateUserRole(param);
    return param.id;
  }

  /**
   * 根據ID獲得信息
   * @param id
   */
  public async info(id) {
    const info = await this.baseSysUserEntity.findOne({ id });
    const userRoles = await this.nativeQuery(
      'select a.roleId from base_sys_user_role a where a.userId = ?',
      [id]
    );
    const department = await this.baseSysDepartmentEntity.findOne({
      id: info.departmentId,
    });
    if (info) {
      delete info.password;
      if (userRoles) {
        info.roleIdList = userRoles.map(e => {
          return parseInt(e.roleId);
        });
      }
    }
    delete info.password;
    if (department) {
      info.departmentName = department.name;
    }
    if (!info.intro) info.intro = '';
    return info;
  }

  /**
   * 修改個人信息
   * @param param
   */
  public async personUpdate(param) {
    param.id = this.ctx.admin.userId;
    if (!_.isEmpty(param.password)) {
      param.password = md5(param.password);
      const userInfo = await this.baseSysUserEntity.findOne({ id: param.id });
      if (!userInfo) {
        throw new CoolCommException('用戶不存在');
      }
      param.passwordV = userInfo.passwordV + 1;
      await this.cacheManager.set(
        `admin:passwordVersion:${param.id}`,
        param.passwordV
      );
    } else {
      delete param.password;
    }
    await this.baseSysUserEntity.save(param);
  }

  /**
   * 修改
   * @param param 數據
   */
  async update(param) {
    if (param.id && param.username === 'admin') {
      throw new CoolCommException('非法操作~');
    }
    if (!_.isEmpty(param.password)) {
      param.password = md5(param.password);
      const userInfo = await this.baseSysUserEntity.findOne({ id: param.id });
      if (!userInfo) {
        throw new CoolCommException('用戶不存在');
      }
      param.passwordV = userInfo.passwordV + 1;
      await this.cacheManager.set(
        `admin:passwordVersion:${param.id}`,
        param.passwordV
      );
    } else {
      delete param.password;
    }
    if (param.status === 0) {
      await this.forbidden(param.id);
    }
    await this.baseSysUserEntity.save(param);
    await this.updateUserRole(param);
  }

  /**
   * 禁用用戶
   * @param userId
   */
  async forbidden(userId) {
    await this.cacheManager.del(`admin:token:${userId}`);
  }

  // 查看身份驗證
  async getIdentity(userId: number) {
    const info = await this.baseUserIdentityEntity.findOne({ userId });
    if (_.isEmpty(info)) throw new CoolCommException('該用戶尚未進行驗證');
    const positive = await this.baseSysLogUploadEntity.findOne({
      id: info.positiveId,
    });
    return { positive: positive.url };
  }

  // 通過身份驗證
  async identityAgree(userId: number) {
    const user = await this.baseSysUserEntity.findOne({ id: userId });
    if (_.isEmpty(user)) throw new CoolCommException('不存在的用戶');
    const info = await this.baseUserIdentityEntity.findOne({ userId });
    if (!_.isEmpty(info)) {
      const positive: any = await this.baseSysLogUploadEntity.findOne({
        id: info.positiveId,
      });
      const path = require('path');
      const fs = require('fs');
      const imagePath = positive.url.replace('https://bondingtechs.com/', '');
      const publicDirectoryPath = path.join(__dirname, '../../../../../');
      const filePath = publicDirectoryPath + imagePath;

      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, err => {
          if (err) {
            console.error('刪除檔案時出現錯誤：', err);
          } else {
            console.log('檔案已成功刪除');
            this.baseSysLogUploadEntity.delete({
              id: info.positiveId,
            });
          }
        });
      }
    }

    return true;
  }
}
