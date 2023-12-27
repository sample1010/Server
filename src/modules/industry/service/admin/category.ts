import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Brackets, Repository } from 'typeorm';
import { IndustryCategoryEntity } from '../../entity/category';
import * as _ from 'lodash';
import { NewsArticleCategoryEntity } from '../../../news/entity/articleCategory';
import { AwardTipsCategoryEntity } from '../../../award/entity/tips_category';

/**
 * 描述
 */
@Provide()
export class AdminIndustryCategoryService extends BaseService {
  @InjectEntityModel(IndustryCategoryEntity)
  industryCategoryEntity: Repository<IndustryCategoryEntity>;

  @InjectEntityModel(AwardTipsCategoryEntity)
  awardTipsCategoryEntity: Repository<AwardTipsCategoryEntity>;

  @InjectEntityModel(NewsArticleCategoryEntity)
  newsArticleCategoryEntity: Repository<NewsArticleCategoryEntity>;

  async list() {
    const data = await this.industryCategoryEntity
      .createQueryBuilder()
      .getMany();

    const fn = async e => {
      e.tipCount = await this.awardTipsCategoryEntity
        .createQueryBuilder()
        .where(
          new Brackets(qb => {
            qb.where('categoryId = :id', { id: e.id });
          })
        )
        .getCount();

      e.articleCount = await this.newsArticleCategoryEntity
        .createQueryBuilder()
        .where(
          new Brackets(qb => {
            qb.where('categoryId = :id', { id: e.id });
          })
        )
        .getCount();

      return e;
    };

    const result = await Promise.all(data.map(e => fn(e)));
    const resultWithChildCount = result.map(e => {
      if (e.parentId === null) {
        e.tipCount = data
          .filter(child => child.parentId === e.id)
          .reduce((a, b) => _.add(a, b.tipCount), 0);
        e.articleCount = data
          .filter(child => child.parentId === e.id)
          .reduce((a, b) => _.add(a, b.articleCount), 0);
      }
      return e;
    });

    return resultWithChildCount;
  }
}
