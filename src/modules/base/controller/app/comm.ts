import { BaseController, CoolController, CoolEps } from '@cool-midway/core';
import { CoolFile } from '@cool-midway/file';
import { Get, Inject, Post, Provide } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { BaseSysLogUploadEntity } from '../../entity/sys/log_upload';

/**
 * 不需要登录的后台接口
 */
@Provide()
@CoolController('/app/comm')
export class BaseAppCommController extends BaseController {
  @InjectEntityModel(BaseSysLogUploadEntity)
  baseSysLogUploadEntity: Repository<BaseSysLogUploadEntity>;

  @Inject()
  coolFile: CoolFile;

  @Inject()
  ctx: Context;

  @Inject()
  eps: CoolEps;

  /**
   * 实体信息与路径
   * @returns
   */
  @Get('/eps', { summary: '实体信息与路径' })
  public async getEps() {
    return this.ok(this.eps);
  }

  /**
   * 文件上传
   */
  @Post('/upload', { summary: '文件上传' })
  async upload() {
    console.log(this.ctx);
    const result = await this.coolFile.upload(this.ctx);
    const log = await this.baseSysLogUploadEntity.save({
      url: result.toString(),
      createBy: this.ctx.user.userId,
      updateBy: this.ctx.user.userId,
    });
    return log.id;
  }

  urlToFile(url, filename, mimeType) {
    return fetch(url)
      .then(res => {
        return res.arrayBuffer();
      })
      .then(buf => {
        return new File([buf], filename, { type: mimeType });
      });
  }

  /**
   * 文件上传模式，本地或者云存储
   */
  @Get('/uploadMode', { summary: '文件上传模式' })
  async uploadMode() {
    return this.ok(await this.coolFile.getMode());
  }
}
