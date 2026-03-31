# Tasks

## 第一阶段：UI组件库统一迁移

- [x] Task 1: 将Pipelines页面迁移到shadcn/ui
  - [x] SubTask 1.1: 替换Ant Design Table为shadcn/ui Table
  - [x] SubTask 1.2: 替换Ant Design Modal为shadcn/ui Dialog
  - [x] SubTask 1.3: 替换Ant Design Form为react-hook-form
  - [x] SubTask 1.4: 添加Toast通知替代message

- [x] Task 2: 将Repositories页面迁移到shadcn/ui
  - [x] SubTask 2.1: 替换Ant Design Table为shadcn/ui Table
  - [x] SubTask 2.2: 替换Ant Design Modal为shadcn/ui Dialog
  - [x] SubTask 2.3: 替换Ant Design Form为react-hook-form
  - [x] SubTask 2.4: 添加Toast通知替代message

- [x] Task 3: 将Deployments页面迁移到shadcn/ui
  - [x] SubTask 3.1: 替换Ant Design Table为shadcn/ui Table
  - [x] SubTask 3.2: 替换Ant Design Modal为shadcn/ui Dialog
  - [x] SubTask 3.3: 替换Ant Design Tabs为shadcn/ui Tabs
  - [x] SubTask 3.4: 添加Toast通知替代message

- [x] Task 4: 将Users页面迁移到shadcn/ui
  - [x] SubTask 4.1: 替换Ant Design Table为shadcn/ui Table
  - [x] SubTask 4.2: 替换Ant Design Modal为shadcn/ui Dialog
  - [x] SubTask 4.3: 替换Ant Design Form为react-hook-form
  - [x] SubTask 4.4: 添加Toast通知替代message

- [x] Task 5: 将Monitoring页面迁移到shadcn/ui
  - [x] SubTask 5.1: 替换Ant Design Card为shadcn/ui Card
  - [x] SubTask 5.2: 替换Ant Design Tabs为shadcn/ui Tabs
  - [x] SubTask 5.3: 替换Ant Design Table/List为shadcn/ui组件
  - [x] SubTask 5.4: 添加Toast通知替代message

- [x] Task 6: 更新Layout组件
  - [x] SubTask 6.1: 移除Ant Design Layout和Menu，使用自定义布局
  - [x] SubTask 6.2: 使用shadcn/ui组件重构侧边栏
  - [x] SubTask 6.3: 使用lucide-react图标替代Ant Design图标

- [x] Task 7: 清理Ant Design依赖
  - [x] SubTask 7.1: 删除DashboardPage.tsx重复文件
  - [x] SubTask 7.2: 从package.json移除antd相关依赖
  - [x] SubTask 7.3: 移除Ant Design样式导入

## 第二阶段：占位符页面实现

- [x] Task 8: 实现PipelineDetail流水线详情页面
  - [x] SubTask 8.1: 创建PipelineDetail.tsx页面组件
  - [x] SubTask 8.2: 实现构建历史列表（分页、状态筛选）
  - [x] SubTask 8.3: 实现构建日志查看功能
  - [x] SubTask 8.4: 实现触发新构建功能（分支选择）
  - [x] SubTask 8.5: 添加构建状态实时更新

- [x] Task 9: 实现DeploymentDetail部署详情页面
  - [x] SubTask 9.1: 创建DeploymentDetail.tsx页面组件
  - [x] SubTask 9.2: 实现Pod状态列表（CPU、内存显示）
  - [x] SubTask 9.3: 实现Kubernetes事件列表
  - [x] SubTask 9.4: 实现Pod日志查看功能
  - [x] SubTask 9.5: 添加Pod选择器和容器选择器

- [x] Task 10: 实现Images镜像管理页面
  - [x] SubTask 10.1: 创建Images.tsx页面组件
  - [x] SubTask 10.2: 实现镜像列表（项目筛选、名称搜索）
  - [x] SubTask 10.3: 实现镜像详情展示
  - [x] SubTask 10.4: 实现漏洞扫描结果展示
  - [x] SubTask 10.5: 实现触发镜像扫描功能

## 第三阶段：数据API集成

- [x] Task 11: Dashboard数据API集成
  - [x] SubTask 11.1: 创建dashboard API服务
  - [x] SubTask 11.2: 实现统计数据获取（构建次数、部署次数、成功率）
  - [x] SubTask 11.3: 实现构建趋势数据获取
  - [x] SubTask 11.4: 实现部署分布数据获取
  - [x] SubTask 11.5: 实现资源使用数据获取
  - [x] SubTask 11.6: 实现时间范围筛选功能

- [x] Task 12: Monitoring数据API集成
  - [x] SubTask 12.1: 调用monitoring/metrics API获取真实数据
  - [x] SubTask 12.2: 调用monitoring/alerts API获取真实告警
  - [x] SubTask 12.3: 实现告警处理功能
  - [x] SubTask 12.4: 实现告警规则管理

## 第四阶段：后端API支持

- [x] Task 13: 添加Dashboard统计API
  - [x] SubTask 13.1: 创建dashboard_handler.go
  - [x] SubTask 13.2: 实现GET /api/v1/dashboard/stats接口
  - [x] SubTask 13.3: 添加路由配置

- [x] Task 14: 添加部署详情相关API
  - [x] SubTask 14.1: 添加GET /api/v1/deployments/:id/pods接口
  - [x] SubTask 14.2: 添加GET /api/v1/deployments/:id/events接口
  - [x] SubTask 14.3: 更新deployment_handler.go

- [ ] Task 15: 添加镜像管理相关API
  - [ ] SubTask 15.1: 添加GET /api/v1/images/:id/tags接口
  - [ ] SubTask 15.2: 更新image_handler.go

## 第五阶段：用户体验增强

- [x] Task 16: 添加主题切换功能
  - [x] SubTask 16.1: 创建theme store（Zustand）
  - [x] SubTask 16.2: 添加深色主题CSS变量
  - [x] SubTask 16.3: 创建ThemeToggle组件
  - [x] SubTask 16.4: 在Layout中添加主题切换按钮

- [x] Task 17: 类型安全改进
  - [x] SubTask 17.1: 修复request.ts返回类型定义
  - [x] SubTask 17.2: 移除所有API调用中的类型断言
  - [x] SubTask 17.3: 添加完整的API响应类型

# Task Dependencies
- Task 7 depends on Task 1, 2, 3, 4, 5, 6
- Task 8, 9, 10 can run in parallel
- Task 11, 12 can run in parallel
- Task 13, 14, 15 can run in parallel
- Task 16, 17 can run in parallel
