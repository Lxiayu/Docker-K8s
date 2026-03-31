# 前端全面增强 Spec

## Why
当前前端项目完成度约65%，存在以下问题：UI组件库混用（Ant Design + shadcn/ui）、多个占位符页面未实现、Dashboard和Monitoring使用静态数据、类型安全问题等。需要全面增强以达到生产就绪状态。

## What Changes
- 统一UI组件库，将所有Ant Design页面迁移到shadcn/ui
- 实现PipelineDetail流水线详情页面
- 实现DeploymentDetail部署详情页面
- 实现Images镜像管理页面
- Dashboard数据API集成
- Monitoring数据API集成
- 添加后端缺失的API支持
- 添加实时日志WebSocket支持
- 添加主题切换功能
- 修复类型安全问题
- 删除重复代码（DashboardPage.tsx）

## Impact
- Affected specs: 前端架构、UI组件库、页面功能
- Affected code:
  - frontend/src/pages/*.tsx（所有页面）
  - frontend/src/components/*.tsx（所有组件）
  - frontend/src/services/*.ts（API服务）
  - frontend/src/styles/globals.css（样式）
  - backend/internal/handlers/*.go（新增API）
  - backend/internal/router/router.go（路由）

## ADDED Requirements

### Requirement: UI组件库统一迁移
The system SHALL use shadcn/ui as the sole UI component library for consistent styling.

#### Scenario: 页面迁移
- **WHEN** 用户访问任何页面
- **THEN** 页面使用shadcn/ui组件构建
- **AND** 视觉风格统一一致

#### Scenario: 移除Ant Design
- **WHEN** 迁移完成
- **THEN** 移除antd相关依赖
- **AND** 减少打包体积

### Requirement: 流水线详情页面
The system SHALL provide a pipeline detail page with build history, logs, and trigger functionality.

#### Scenario: 查看构建历史
- **WHEN** 用户访问流水线详情页
- **THEN** 显示该流水线的所有构建记录
- **AND** 支持分页和状态筛选

#### Scenario: 查看构建日志
- **WHEN** 用户点击查看日志
- **THEN** 显示构建的详细日志
- **AND** 支持实时日志流（WebSocket）

#### Scenario: 触发新构建
- **WHEN** 用户点击触发构建
- **THEN** 可以选择分支并触发新构建

### Requirement: 部署详情页面
The system SHALL provide a deployment detail page with Pod status, events, and logs.

#### Scenario: 查看Pod状态
- **WHEN** 用户访问部署详情页
- **THEN** 显示所有Pod的运行状态
- **AND** 显示CPU、内存使用情况

#### Scenario: 查看部署事件
- **WHEN** 用户查看事件标签
- **THEN** 显示Kubernetes事件列表

#### Scenario: 查看Pod日志
- **WHEN** 用户选择Pod并查看日志
- **THEN** 显示该Pod的容器日志

### Requirement: 镜像管理页面
The system SHALL provide an image management page with Harbor integration.

#### Scenario: 查看镜像列表
- **WHEN** 用户访问镜像管理页
- **THEN** 显示Harbor仓库中的所有镜像
- **AND** 支持项目和名称筛选

#### Scenario: 查看镜像详情
- **WHEN** 用户点击镜像
- **THEN** 显示镜像的详细信息和漏洞扫描结果

#### Scenario: 触发镜像扫描
- **WHEN** 用户点击扫描按钮
- **THEN** 触发镜像安全扫描

### Requirement: 仪表盘数据集成
The system SHALL display real-time data on the dashboard from backend APIs.

#### Scenario: 统计数据展示
- **WHEN** 用户访问仪表盘
- **THEN** 显示真实的构建次数、部署次数、成功率等统计

#### Scenario: 时间范围筛选
- **WHEN** 用户选择时间范围
- **THEN** 图表数据根据时间范围更新

### Requirement: 监控数据集成
The system SHALL display real-time monitoring data from backend APIs.

#### Scenario: 告警列表
- **WHEN** 用户访问监控页面
- **THEN** 显示从Prometheus获取的真实告警

#### Scenario: 处理告警
- **WHEN** 用户点击处理告警
- **THEN** 可以标记告警状态

### Requirement: 实时日志WebSocket
The system SHALL provide real-time log streaming via WebSocket.

#### Scenario: 构建日志流
- **WHEN** 用户查看正在进行的构建日志
- **THEN** 日志实时更新

#### Scenario: Pod日志流
- **WHEN** 用户开启实时跟踪
- **THEN** Pod日志实时更新

### Requirement: 主题切换
The system SHALL support light and dark theme switching.

#### Scenario: 切换主题
- **WHEN** 用户点击主题切换按钮
- **THEN** 界面在浅色和深色主题间切换
- **AND** 主题偏好被保存

### Requirement: 类型安全改进
The system SHALL have proper TypeScript types for all API responses.

#### Scenario: API响应类型
- **WHEN** 调用API
- **THEN** 返回值有正确的类型定义
- **AND** 无需使用类型断言

## MODIFIED Requirements

### Requirement: 页面组件迁移
将以下页面从Ant Design迁移到shadcn/ui：
- Pipelines.tsx
- Repositories.tsx
- Deployments.tsx
- Users.tsx
- Monitoring.tsx

### Requirement: Layout组件
完全使用shadcn/ui组件，移除Ant Design依赖。

## REMOVED Requirements

### Requirement: 重复页面
**Reason**: DashboardPage.tsx与Dashboard.tsx功能重复
**Migration**: 删除DashboardPage.tsx，保留Dashboard.tsx

### Requirement: Ant Design依赖
**Reason**: 统一使用shadcn/ui
**Migration**: 完成迁移后移除antd相关依赖
