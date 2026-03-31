# Checklist

## 第一阶段：UI组件库统一迁移

### Pipelines页面迁移
- [x] Pipelines页面使用shadcn/ui Table组件
- [x] Pipelines页面使用shadcn/ui Dialog组件
- [x] Pipelines页面使用react-hook-form表单
- [x] Pipelines页面使用Sonner Toast通知

### Repositories页面迁移
- [x] Repositories页面使用shadcn/ui Table组件
- [x] Repositories页面使用shadcn/ui Dialog组件
- [x] Repositories页面使用react-hook-form表单
- [x] Repositories页面使用Sonner Toast通知

### Deployments页面迁移
- [x] Deployments页面使用shadcn/ui Table组件
- [x] Deployments页面使用shadcn/ui Dialog组件
- [x] Deployments页面使用shadcn/ui Tabs组件
- [x] Deployments页面使用Sonner Toast通知

### Users页面迁移
- [x] Users页面使用shadcn/ui Table组件
- [x] Users页面使用shadcn/ui Dialog组件
- [x] Users页面使用react-hook-form表单
- [x] Users页面使用Sonner Toast通知

### Monitoring页面迁移
- [x] Monitoring页面使用shadcn/ui Card组件
- [x] Monitoring页面使用shadcn/ui Tabs组件
- [x] Monitoring页面使用shadcn/ui Table/List组件
- [x] Monitoring页面使用Sonner Toast通知

### Layout组件更新
- [x] Layout组件移除Ant Design Layout和Menu
- [x] Layout组件使用自定义布局
- [x] Layout组件使用lucide-react图标

### 清理Ant Design依赖
- [x] DashboardPage.tsx重复文件已删除
- [x] package.json中antd依赖已移除
- [x] Ant Design样式导入已移除

## 第二阶段：占位符页面实现

### PipelineDetail页面
- [x] PipelineDetail页面组件已创建
- [x] 构建历史列表正常显示
- [x] 构建日志查看功能正常
- [x] 触发新构建功能正常
- [x] 构建状态实时更新正常

### DeploymentDetail页面
- [x] DeploymentDetail页面组件已创建
- [x] Pod状态列表正常显示
- [x] Kubernetes事件列表正常显示
- [x] Pod日志查看功能正常
- [x] Pod选择器和容器选择器正常工作

### Images镜像管理页面
- [x] Images页面组件已创建
- [x] 镜像列表正常显示
- [x] 镜像详情展示正常
- [x] 漏洞扫描结果展示正常
- [x] 触发镜像扫描功能正常

## 第三阶段：数据API集成

### Dashboard数据集成
- [x] Dashboard API服务已创建
- [x] 统计数据从API获取
- [x] 构建趋势数据从API获取
- [x] 部署分布数据从API获取
- [x] 资源使用数据从API获取
- [x] 时间范围筛选功能正常

### Monitoring数据集成
- [x] 监控指标从API获取
- [x] 告警列表从API获取
- [x] 告警处理功能正常
- [x] 告警规则管理功能正常

## 第四阶段：后端API支持

### Dashboard统计API
- [x] dashboard_handler.go已创建
- [x] GET /api/v1/dashboard/stats接口正常
- [x] 路由配置已添加

### 部署详情API
- [x] GET /api/v1/deployments/:id/pods接口正常
- [x] GET /api/v1/deployments/:id/events接口正常
- [x] deployment_handler.go已更新

### 镜像管理API
- [x] image.ts服务已创建
- [x] 镜像相关API已实现

## 第五阶段：用户体验增强

### 主题切换功能
- [x] theme store已创建（Zustand）
- [x] 深色主题CSS变量已添加
- [x] ThemeToggle组件已创建
- [x] Layout中主题切换按钮正常工作

### 类型安全改进
- [x] request.ts返回类型定义已修复
- [x] API调用中的类型断言已移除
- [x] 完整的API响应类型已添加

## 最终验证
- [x] 前端构建成功（npm run build）
- [x] 后端编译成功（go build ./...）
- [x] 所有页面正常显示
- [x] 所有API调用正常工作
- [x] 主题切换正常工作
