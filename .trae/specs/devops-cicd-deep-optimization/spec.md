# DevOps CI/CD 与 Docker/K8s 深度优化 + 前端 UI 重构 Spec

## Why
项目即将上线，但经全面审计发现 80+ 个基础设施问题（安全漏洞、CI/CD 缺陷、K8s 配置不完整）和前端 UI 一致性/完整性问题。需要在上线前系统性修复，打造类似 Obsidian 的简约清晰界面，同时确保基础设施安全可靠。

## What Changes

### 基础设施优化
- 修复所有 Dockerfile 安全问题（非 root、固定版本、.dockerignore）
- 修复 K8s 部署清单（SecurityContext、PDB、HPA、NetworkPolicy）
- 修复 CI/CD 工作流（测试顺序、权限、并发控制）
- 完善后端健康检查（真实 DB/Redis 连通性检测）
- 移除硬编码密码，统一 Secret 引用
- 修复 Harbor GC、RBAC、审计日志
- 修复监控告警规则引用不存在指标的问题

### 前端 UI 重构（Obsidian 风格）
- 重构 Layout：语义色彩系统、侧边栏激活指示器、面包屑导航、折叠 tooltip
- 统一所有页面设计语言：标题层级、间距、卡片风格、表单验证
- 统一列表页模式：分页组件、搜索筛选、空状态引导、操作列压缩
- 补全缺失功能：审计日志页、告警规则编辑、部署编辑、用户状态切换
- 图表暗色模式适配
- 统一表单验证为 Zod + react-hook-form

## Impact
- Affected specs: 全面基础设施 + 前端 UI
- Affected code: Dockerfile × 2, K8s YAML × 20+, CI/CD × 1, 后端 Go × 6, 前端 TSX × 15+, Shell 脚本 × 4

## ADDED Requirements

### Requirement: Docker 安全加固
所有容器 SHALL 以非 root 用户运行，SHALL 使用固定版本基础镜像。

#### Scenario: 构建前端镜像
- **WHEN** 执行 `docker build` for frontend
- **THEN** 使用 `npm ci`，容器以 nginx 用户运行，包含 HEALTHCHECK

### Requirement: K8s 安全与可靠性
所有 Deployment SHALL 配置 SecurityContext、PDB、HPA、NetworkPolicy。

#### Scenario: Pod 安全
- **WHEN** Pod 被调度运行
- **THEN** 以非 root 运行，禁止特权提升

### Requirement: CI/CD 流程安全
CI/CD SHALL 先测试后构建，SHALL 使用最小权限，SHALL 不在 PR 上触发部署。

### Requirement: 真实健康检查
后端 /ready 端点 SHALL 检查 PostgreSQL 和 Redis 连通性。

### Requirement: 无硬编码密码
所有配置 SHALL 引用 Secret 或环境变量。

### Requirement: Obsidian 风格 UI 设计
前端 SHALL 采用简约清晰的分区设计，类似 Obsidian 应用。

#### Scenario: 侧边栏设计
- **WHEN** 用户查看应用
- **THEN** 侧边栏使用语义色彩、左侧激活指示器、折叠时显示 tooltip

#### Scenario: 列表页一致性
- **WHEN** 用户浏览任何列表页
- **THEN** 统一的表格样式、分页组件、搜索筛选、空状态引导

#### Scenario: 表单一致性
- **WHEN** 用户填写任何表单
- **THEN** 全部使用 Zod + react-hook-form 验证，统一错误提示

#### Scenario: 暗色模式
- **WHEN** 用户切换到暗色模式
- **THEN** 所有组件（包括图表）正确适配暗色主题

### Requirement: 功能完整性
前端 SHALL 覆盖 CI/CD 平台所有核心功能。

#### Scenario: 审计日志
- **WHEN** 管理员需要查看操作记录
- **THEN** 可以访问审计日志页面，支持筛选和分页

#### Scenario: 告警规则管理
- **WHEN** 运维人员需要管理告警规则
- **THEN** 可以创建、编辑、启用/禁用告警规则

#### Scenario: 部署编辑
- **WHEN** 用户需要修改部署配置
- **THEN** 可以编辑部署信息并保存

## MODIFIED Requirements
（无已有 spec 被修改）

## REMOVED Requirements
（无功能被移除）
