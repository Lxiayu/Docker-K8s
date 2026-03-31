# 前端 UI 优化 Spec

## Why
当前前端使用 Ant Design 组件库，但需要升级到更现代、更灵活的 shadcn/ui 组件库，以提升开发体验、代码可维护性和 AI 友好的集成能力。同时需要完善数据可视化看板和优化登录流程。

## What Changes
- 将前端组件库从 Ant Design 迵换到 shadcn/ui
- 添加数据可视化看板模块（Dashboard）
- 优化登录页面，添加注册入口
- 添加图表库支持（Recharts）
- 优化整体页面布局和交互体验

## Impact
- Affected specs: 前端架构、组件库选择
- Affected code: 
  - frontend/src/components/*
  - frontend/src/pages/*
  - frontend/package.json
  - frontend/src/styles/*

## ADDED Requirements

### Requirement: 数据可视化看板
The system SHALL provide a comprehensive data visualization dashboard with multiple chart types.

#### Scenario: 折线图展示
- **WHEN** 用户访问仪表盘页面
- **THEN** 知看到折线图展示趋势数据

#### Scenario: 柱状图展示
- **WHEN** 用户访问仪表盘页面
- **THEN** 知看到柱状图展示对比数据

#### Scenario: 响应式布局
- **WHEN** 用户在不同设备上访问仪表盘
- **THEN** 页面布局自动适应屏幕尺寸

#### Scenario: 数据筛选
- **WHEN** 用户选择时间范围或筛选条件
- **THEN** 图表数据实时更新

### Requirement: 登录流程优化
The system SHALL provide clear login和注册入口切换功能。

#### Scenario: 注册入口
- **WHEN** 用户在登录页面
- **THEN** 能看到明显的"注册"按钮

#### Scenario: 页面切换
- **WHEN** 用户点击注册按钮
- **THEN** 平滑跳转到注册页面

#### Scenario: 返回登录
- **WHEN** 用户在注册页面
- **THEN** 能看到返回登录的链接

### Requirement: shadcn/ui 组件集成
The system SHALL use shadcn/ui component library for consistent UI design.

#### Scenario: 绌钮组件
- **WHEN** 使用按钮组件
- **THEN** 栌钮具有一致的样式和行为

#### Scenario: 表单组件
- **WHEN** 使用表单组件
- **THEN** 表单具有统一的验证和交互

#### Scenario: 卡片组件
- **WHEN** 使用卡片组件
- **THEN** 卡片具有一致的阴影和圆角

## MODIFIED Requirements

### Requirement: 页面布局
所有页面 SHALL 使用统一的布局结构和导航模式。

#### Scenario: 侧边栏导航
- **WHEN** 用户访问任何页面
- **THEN** 侧边栏导航保持一致

#### Scenario: 顶部栏
- **WHEN** 用户访问任何页面
- **THEN** 顶部栏显示用户信息和操作

## REMOVED Requirements

### Requirement: Ant Design 组件
**Reason**: 替换为更现代的 shadcn/ui 组件库
**Migration**: 移除 Ant Design 相关依赖，安装 shadcn/ui 组件
