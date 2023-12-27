import { BaseService, CoolCommException } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import { Context } from 'koa';
import { Repository } from 'typeorm';
import { AwardTipsEntity } from '../../entity/tips';
import { AwardTipsUserEntity } from '../../entity/tips_user';

import * as _ from 'lodash';
import { AwardTipsCollectionEntity } from '../../entity/tips_collection';

/**
 * 描述
 */
@Provide()
export class TipAppService extends BaseService {
  @InjectEntityModel(AwardTipsEntity)
  tipEntity: Repository<AwardTipsEntity>;

  @InjectEntityModel(AwardTipsUserEntity)
  tipViewEntity: Repository<AwardTipsUserEntity>;

  @InjectEntityModel(AwardTipsCollectionEntity)
  tipCollectionEntity: Repository<AwardTipsCollectionEntity>;

  @Inject()
  ctx: Context;

  /**
   * 根据ID获得信息
   * @param id
   */
  public async getInfo({ id }) {
    const userId = this.ctx.user.userId;
    const [info] = await this.nativeQuery(`
      SELECT
        a.id,
        a.title,
        a.thumbnail,
        a.content,
        a.publishDate
      FROM award_tips a
      WHERE a.id = ${id}
    `);
    const isCollection = await this.tipCollectionEntity.findOne({
      tipId: id,
      userId,
    });
    return { ...info, isCollection };
  }

  /**
   * 取得小知識分頁
   *
   */
  public async page({ page = 1, size = 10 }) {
    const query = { page, size };
    const sql = `
        SELECT
            a.id,
            a.title,
            a.publishDate,
            a.thumbnail,
            count(b.id) as views,
            GROUP_CONCAT(distinct d.name) AS categories

        FROM
            award_tips a
            LEFT JOIN award_tips_user b on a.id = b.tipId
            LEFT JOIN award_tips_category c on a.id = c.tipId
            LEFT JOIN industry_category d on d.id = c.categoryId
        WHERE b.userId = ${this.ctx.user.userId} AND a.status = 7
        GROUP BY a.id
    `;

    const result = await this.sqlRenderPage(
      sql,
      _.assign(query, {
        order: 'publishDate',
      })
    );
    return result;
  }

  /**
   * 取得今日小知識
   *
   */
  public async today() {
    const info = await this.tipEntity.findOne({
      publishDate: await this.formatDateInGMT8(new Date()),
      status: 7,
    });
    if (_.isEmpty(info)) return;

    const exist = await this.tipViewEntity.findOne({
      userId: this.ctx.user.userId,
      tipId: info.id,
    });

    if (!_.isEmpty(exist)) return;

    await this.tipViewEntity.save({
      userId: this.ctx.user.userId,
      tipId: info.id,
    });

    delete info.createTime;
    delete info.updateTime;
    delete info.status;

    return info;
  }

  // async todayFormat() {
  //   const today = new Date();
  //   const timezoneOffset = today.getTimezoneOffset();

  //   // 计算所需时区时间的时间戳（本地时间 + 时区偏移）
  //   const targetTimestamp = today.getTime() + timezoneOffset * 60 * 1000;

  //   // 创建新的 Date 对象，表示所需时区的时间
  //   const targetDate = new Date(targetTimestamp);

  //   // 提取年份、月份和日期
  //   const year = targetDate.getUTCFullYear();
  //   const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  //   const day = String(targetDate.getUTCDate()).padStart(2, '0');
  //   return year + '-' + month + '-' + day;
  // }

  async formatDateInGMT8(date) {
    // 获取当前本地时间
    const localDate = new Date(date);

    // 添加东八区的时区偏移量（分钟数为负值，所以需要加上）
    const gmt8Time = localDate.getTime() + 8 * 60 * 60 * 1000;

    // 创建新的 Date 对象，表示东八区的时间
    const gmt8Date = new Date(gmt8Time);

    // 提取年份、月份和日期
    const year = gmt8Date.getFullYear();
    const month = String(gmt8Date.getMonth() + 1).padStart(2, '0');
    const day = String(gmt8Date.getDate()).padStart(2, '0');

    // 拼接并返回格式化后的字符串
    return `${year}-${month}-${day}`;
  }

  public async collection({ id }) {
    const user = this.ctx.user;
    if (!id) throw new CoolCommException('請輸入ID');
    const articleExist = await this.tipEntity.findOne({ id });
    if (_.isEmpty(articleExist)) throw new CoolCommException('找不到該文章');
    const collectionExist = await this.tipCollectionEntity.findOne({
      tipId: id,
      userId: user.userId,
    });

    const action = _.isEmpty(collectionExist) ? 'save' : 'delete';
    await this.tipCollectionEntity[action]({
      tipId: id,
      userId: user.userId,
    });
    return { id, status: _.isEmpty(collectionExist) };
  }

  public async viewHistory(params) {
    const userId = this.ctx.user.userId;
    const { keyWord, order = 'publishDate', sort = 'desc', category } = params;

    const sql = `
        SELECT
            z.id,
            z.title,
            z.thumbnail,
            z.publishDate,
            GROUP_CONCAT(distinct d.name) AS categories

        FROM
            award_tips_user a
            LEFT JOIN award_tips z on a.tipId = z.id
            LEFT JOIN award_tips_collection b on z.id = b.tipId
            LEFT JOIN award_tips_category c on z.id = c.tipId
            LEFT JOIN industry_category d on z.id = c.categoryId
        WHERE a.userId = ${userId}
            AND z.status = 7
            ${this.setSql(category, 'AND d.slug = (?)', category)}
            ${this.setSql(keyWord, 'AND (z.title LIKE ?)', [`%${keyWord}%`])}
        GROUP BY a.id
      `;

    const result = await this.sqlRenderPage(
      sql,
      _.assign(params, {
        order,
        sort,
      })
    );

    return result;
  }
}
