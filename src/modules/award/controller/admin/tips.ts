import { BaseController, CoolController } from '@cool-midway/core';
import { Provide } from '@midwayjs/decorator';
import { SelectQueryBuilder } from 'typeorm';
import { IndustryCategoryEntity } from '../../../industry/entity/category';
import { AwardTipsEntity } from '../../entity/tips';
import { AwardTipsCategoryEntity } from '../../entity/tips_category';
import { AwardTipsCollectionEntity } from '../../entity/tips_collection';
import { AwardTipsUserEntity } from '../../entity/tips_user';
import { AdminAwardTipsService } from '../../service/admin/tips';

/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: AwardTipsEntity,
  service: AdminAwardTipsService,
  pageQueryOp: {
    keyWordLikeFields: ['title'],
    fieldEq: ['status'],
    select: [
      'a.*',
      'count(DISTINCT b.id) as receives',
      'count(DISTINCT c.id) as collections',
      'GROUP_CONCAT(DISTINCT e.name) as categories',
    ],
    join: [
      {
        entity: AwardTipsUserEntity,
        alias: 'b',
        condition: 'a.id = b.tipId',
        type: 'leftJoin',
      },
      {
        entity: AwardTipsCollectionEntity,
        alias: 'c',
        condition: 'a.id = c.tipId',
        type: 'leftJoin',
      },
      {
        entity: AwardTipsCategoryEntity,
        alias: 'd',
        condition: 'a.id = d.tipId',
        type: 'leftJoin',
      },
      {
        entity: IndustryCategoryEntity,
        alias: 'e',
        condition: 'd.categoryId = e.id',
        type: 'leftJoin',
      },
    ],
    extend: async (find: SelectQueryBuilder<AwardTipsEntity>) => {
      find.groupBy('a.id');
    },
  },
})
export class AdminAwardTipsController extends BaseController { }
