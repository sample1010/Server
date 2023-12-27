import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { NewsArticleCommentEntity } from '../../entity/comment';
import { NewsArticleCommentAdminService } from '../../service/admin/comment';

/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: NewsArticleCommentEntity,
  service: NewsArticleCommentAdminService,
})
export class AdminNewsCommentController extends BaseController { }
