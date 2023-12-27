import { ModuleConfig } from '@cool-midway/core';
// import { NewsContentMiddleware } from './middleware/content-auth';

/**
 * 模块配置
 */
export default () => {
  return {
    // 模块名称
    name: 'news',
    // 模块描述
    description: 'news',
    // 中间件，只对本模块有效
    // middlewares: [NewsContentMiddleware],
    middlewares: [],
    // 中间件，全局有效
    globalMiddlewares: [],
    // 模块加载顺序，默认为0，值越大越优先加载
    order: 0,
  } as ModuleConfig;
};
