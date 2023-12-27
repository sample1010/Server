import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { IndustryCategoryEntity } from '../../entity/category';
import { SelectQueryBuilder } from 'typeorm';
import { NewsArticleCategoryEntity } from '../../../news/entity/articleCategory';
import { AwardTipsCategoryEntity } from '../../../award/entity/tips_category';
import { AdminIndustryCategoryService } from '../../service/admin/category';

/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: IndustryCategoryEntity,
  service: AdminIndustryCategoryService,
  pageQueryOp: {
    select: ['a.*', 'count(b.id) as tipCount', 'count(c.id) as articleCount'],
    keyWordLikeFields: ['name', 'slug'],
    join: [
      {
        entity: AwardTipsCategoryEntity,
        alias: 'b',
        condition: 'a.id = b.categoryId',
        type: 'leftJoin',
      },
      {
        entity: NewsArticleCategoryEntity,
        alias: 'c',
        condition: 'a.id = c.categoryId',
        type: 'leftJoin',
      },
    ],
    extend: async (find: SelectQueryBuilder<IndustryCategoryEntity>) => {
      find.groupBy('a.id');
    },
  },
})
export class AdminIndustryCategoryController extends BaseController { }
