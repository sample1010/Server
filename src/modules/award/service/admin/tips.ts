import { BaseService, CoolCommException } from '@cool-midway/core';
import { FORMAT, Inject, Provide, TaskLocal } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { AwardTipsEntity } from '../../entity/tips';
import { AwardTipsCategoryEntity } from '../../entity/tips_category';

/**
 * 描述
 */
@Provide()
export class AdminAwardTipsService extends BaseService {
  @InjectEntityModel(AwardTipsEntity)
  awardTipsEntity: Repository<AwardTipsEntity>;

  @InjectEntityModel(AwardTipsCategoryEntity)
  awardTipsCategoryEntity: Repository<AwardTipsCategoryEntity>;

  @Inject()
  ctx;

  async add(param) {
    const { categories, publishDate } = param;
    if (!categories) throw new CoolCommException('請選擇分類');

    const tip = await this.awardTipsEntity.save({
      ...param,
      createBy: this.ctx.admin.userId,
      updateBy: this.ctx.admin.userId,
      status: this.tipStatus(publishDate),
    });

    await this.updateCategories({
      ...param,
      id: tip.id,
    });

    return tip;
  }

  // 判斷是否過已發布
  tipStatus(publishDate) {
    if (!publishDate) return 6;
    const targetTime = new Date(publishDate);
    const currentTime = new Date();
    return currentTime >= targetTime ? 7 : 25;
  }

  // 定時任務，監測排程
  @TaskLocal(FORMAT.CRONTAB.EVERY_DAY)
  async watchArticleStatus() {
    const tips = await this.awardTipsEntity.find({ status: 25 });
    tips.forEach(async (tip: any) => {
      const status = this.tipStatus(tip.publishDate);
      if (status === 7) {
        await this.awardTipsEntity.save({
          id: tip.id,
          status,
        });
      }
    });
  }

  async update(param) {
    const { categories, publishDate } = param;
    const tip = await this.awardTipsEntity.save({
      ...param,
      updateBy: this.ctx.admin.userId,
      status: this.tipStatus(publishDate),
    });

    await this.updateCategories({
      categories: categories,
      id: tip.id,
    });

    return tip;
  }

  async info(id) {
    const info = await this.awardTipsEntity.findOne({ id });
    const categories = await this.nativeQuery(
      `
      SELECT
        categoryId
      FROM award_tips_category
      WHERE tipId = ${id}
    `
    );
    return {
      ...info,
      categories: categories?.map(e => parseInt(e.categoryId)),
    };
  }

  /**
   * 更新分類关系
   * @param user
   */
  async updateCategories(tip) {
    await this.awardTipsCategoryEntity.delete({ tipId: tip.id });
    if (tip.categories) {
      for (const category of tip.categories) {
        await this.awardTipsCategoryEntity.save({
          tipId: tip.id,
          categoryId: category,
        });
      }
    }
  }
}
