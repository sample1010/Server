import { BaseController, CoolController } from '@cool-midway/core';
import { Body, Inject, Post, Provide } from '@midwayjs/decorator';
import { BaseSysUserEntity } from '../../../entity/sys/user';
import { BaseSysUserService } from '../../../service/sys/user';

/**
 * 系统用户
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: BaseSysUserEntity,
  service: BaseSysUserService,
  listQueryOp: {
    select: ['a.id', 'CONCAT(a.firstName, a.lastName) AS name'],
    where: () => {
      return [['a.id > :id', { id: 1 }]];
    },
  },
})
export class BaseSysUserController extends BaseController {
  @Inject()
  baseSysUserService: BaseSysUserService;

  /**
   * 移动部門
   */
  @Post('/move', { summary: '移动部門' })
  async move(
    @Body('departmentId') departmentId: number,
    @Body('userIds') userIds: []
  ) {
    await this.baseSysUserService.move(departmentId, userIds);
    return this.ok();
  }

  /**
   * 查看身份驗證
   */
  @Post('/getIdentity', { summary: '查看身份驗證' })
  async getIdentity(@Body('userId') userId: number) {
    return this.ok(await this.baseSysUserService.getIdentity(userId));
  }

  /**
   * 身份驗證通過
   */
  @Post('/identityAgree', { summary: '同意身份驗證' })
  async identityAgree(@Body('userId') userId: number) {
    return this.ok(await this.baseSysUserService.identityAgree(userId));
  }
}
