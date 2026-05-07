# Tasks

## Phase 1: Docker 镜像安全加固

- [x] Task 1: 创建 .dockerignore 文件
  - [x] SubTask 1.1: 创建 `frontend/.dockerignore`（排除 node_modules, dist, .git, *.log, .env*）
  - [x] SubTask 1.2: 创建 `backend/.dockerignore`（排除 bin/, vendor/, .git, *.log, tmp/）

- [x] Task 2: 优化前端 Dockerfile
  - [x] SubTask 2.1: 使用 `npm ci` 替代 `npm install`
  - [x] SubTask 2.2: 固定基础镜像版本 `node:18.19-alpine3.19` 和 `nginx:1.25-alpine3.19`
  - [x] SubTask 2.3: 添加非 root 用户运行（nginx 用户）
  - [x] SubTask 2.4: 添加 HEALTHCHECK 指令

- [x] Task 3: 优化后端 Dockerfile
  - [x] SubTask 3.1: 固定 alpine 基础镜像版本 `alpine:3.19`
  - [x] SubTask 3.2: 添加非 root 用户运行（appuser）

## Phase 2: K8s 部署安全与可靠性

- [x] Task 4: 为所有 Deployment 添加 SecurityContext
  - [x] SubTask 4.1: 修改 `kubernetes/backend-deployment.yaml` 添加 SecurityContext
  - [x] SubTask 4.2: 修改 `kubernetes/frontend-deployment.yaml` 添加 SecurityContext
  - [x] SubTask 4.3: 修改 `kubernetes/redis-deployment.yaml` 添加 SecurityContext
  - [x] SubTask 4.4: 修改 `backend/k8s/backend-deployment.yaml` 添加 SecurityContext
  - [x] SubTask 4.5: 修改 `frontend/k8s/frontend-deployment.yaml` 添加 SecurityContext
  - [x] SubTask 4.6: 修改 `database/postgres/statefulset.yaml` 添加 SecurityContext

- [x] Task 5: 创建 PodDisruptionBudget
  - [x] SubTask 5.1: 创建 backend PDB（minAvailable: 1）
  - [x] SubTask 5.2: 创建 frontend PDB（minAvailable: 1）

- [x] Task 6: 创建 HorizontalPodAutoscaler
  - [x] SubTask 6.1: 创建 backend HPA（cpu 70%, min 2, max 10）
  - [x] SubTask 6.2: 创建 frontend HPA（cpu 70%, min 2, max 10）

- [x] Task 7: 创建 NetworkPolicy
  - [x] SubTask 7.1: 创建 database namespace NetworkPolicy（仅允许 cicd-system 访问 5432）
  - [x] SubTask 7.2: 创建 Redis NetworkPolicy（仅允许 cicd-system 访问 6379）
  - [x] SubTask 7.3: 创建 cicd-system namespace 默认拒绝策略

- [x] Task 8: 修复 Redis 持久化与 K8s 安全配置
  - [x] SubTask 8.1: 将 Redis emptyDir 替换为 PVC，启用 AOF
  - [x] SubTask 8.2: 将 backend ConfigMap 明文密码替换为 Secret 引用
  - [x] SubTask 8.3: 修复 pg_hba.conf trust → scram-sha-256，限制 host 访问 CIDR
  - [x] SubTask 8.4: 添加 secrets.yaml 占位符密码注释说明

## Phase 3: CI/CD 工作流优化

- [x] Task 9: 修复 GitHub Actions 工作流
  - [x] SubTask 9.1: 添加顶层 `permissions: contents: read`
  - [x] SubTask 9.2: 将 test job 移到 build 之前（needs: setup）
  - [x] SubTask 9.3: 移除前端测试 `|| true`
  - [x] SubTask 9.4: 修复 deploy job 条件，PR 不触发部署
  - [x] SubTask 9.5: 添加 `concurrency` 控制
  - [x] SubTask 9.6: 添加 `environment` 声明
  - [x] SubTask 9.7: 固定 Trivy Action 版本 `@v0.28.0`
  - [x] SubTask 9.8: 固定 gosec 版本
  - [x] SubTask 9.9: 添加 Go 和 npm 缓存
  - [x] SubTask 9.10: 添加 artifact retention-days: 7
  - [x] SubTask 9.11: rollback 添加 HTTP 健康检查验证

## Phase 4: 后端健康检查与中间件增强

- [x] Task 10: 实现真实 /ready 端点
  - [x] SubTask 10.1: 修改 `pkg/database/database.go` 添加 Ping() 方法
  - [x] SubTask 10.2: 修改 `pkg/redis/redis.go` 添加 Ping() 方法
  - [x] SubTask 10.3: 修改 `/ready` 端点检查 DB 和 Redis 连通性
  - [x] SubTask 10.4: 为 `/health` 添加 uptime 信息

- [x] Task 11: 添加速率限制中间件
  - [x] SubTask 11.1: 创建 `internal/middleware/ratelimit.go`
  - [x] SubTask 11.2: 对 login 端点添加严格速率限制
  - [x] SubTask 11.3: 在 router.go 中集成

- [x] Task 12: 收紧 CORS 配置
  - [x] SubTask 12.1: 修改 `middleware/cors.go`，AllowOrigins 从 `*` 改为可配置列表

## Phase 5: Harbor 修复

- [x] Task 13: 修复 Harbor GC 与配置
  - [x] SubTask 13.1: 修改 GC CronJob 使用 Harbor API v2.0 执行实际 GC
  - [x] SubTask 13.2: 修复 RBAC namespace（harbor-system → harbor）
  - [x] SubTask 13.3: 开启审计日志 `auditLog.enabled: true`

## Phase 6: 监控告警修复

- [x] Task 14: 修复自定义告警规则
  - [x] SubTask 14.1: 重写 `custom-business-metrics.yaml` 使用实际 CI/CD 平台指标
  - [x] SubTask 14.2: 添加应用级 Grafana Dashboard

## Phase 7: 脚本修复

- [x] Task 15: 修复启动脚本
  - [x] SubTask 15.1: `start.sh` 从环境变量读取密码
  - [x] SubTask 15.2: `quick-start.sh` 移除不存在的路径引用
  - [x] SubTask 15.3: `stop.sh` 添加超时和 SIGKILL 回退
  - [x] SubTask 15.4: `deploy-all.sh` 不打印默认凭证
  - [x] SubTask 15.5: 修复日志栈 StorageClass 命名冲突

## Phase 8: 前端 UI 重构 — Layout 与设计系统

- [x] Task 16: 重构 Layout 组件为 Obsidian 风格
  - [x] SubTask 16.1: 侧边栏使用语义 CSS 变量色彩，替换硬编码 bg-slate-900
  - [x] SubTask 16.2: 激活菜单项使用左侧 3px 蓝色指示器 + 浅色背景，替代整行深色背景
  - [x] SubTask 16.3: 侧边栏折叠时菜单项显示 tooltip
  - [x] SubTask 16.4: 主内容区使用 `bg-background` 替代硬编码颜色
  - [x] SubTask 16.5: 添加面包屑导航组件
  - [x] SubTask 16.6: 添加 Profile 路由到侧边栏菜单

- [x] Task 17: 创建统一的页面头部组件 PageHeader
  - [x] SubTask 17.1: 创建 `components/PageHeader.tsx`，包含标题 + 描述 + 右侧操作区
  - [x] SubTask 17.2: 统一所有页面标题使用 `text-2xl font-bold` + 描述副标题

## Phase 9: 前端 UI 重构 — 列表页统一

- [x] Task 18: 创建统一分页组件 Pagination
  - [x] SubTask 18.1: 创建 `components/ui/pagination.tsx`，使用 shadcn Select 做 pageSize 选择
  - [x] SubTask 18.2: 统一所有列表页使用该分页组件

- [x] Task 19: 创建统一空状态组件 EmptyState
  - [x] SubTask 19.1: 创建 `components/EmptyState.tsx`，包含图标 + 描述 + CTA 按钮
  - [x] SubTask 19.2: 在所有列表页空数据时使用

- [x] Task 20: 修复各列表页一致性问题
  - [x] SubTask 20.1: Pipelines 页面 — 状态列使用 Badge 组件，添加搜索功能
  - [x] SubTask 20.2: Deployments 页面 — 实现编辑功能（调用 API），添加页面标题描述，状态翻译为中文
  - [x] SubTask 20.3: Images 页面 — 仓库选择从 API 动态获取，pageSize 可配置
  - [x] SubTask 20.4: Users 页面 — 添加搜索/筛选功能，pageSize 可配置
  - [x] SubTask 20.5: Repositories 页面 — 修复 Hook 规则违反（条件 return 后调用 useMutation）

## Phase 10: 前端 UI 重构 — 表单与图表统一

- [x] Task 21: 统一表单验证（Zod + react-hook-form）
  - [x] SubTask 21.1: Login 页面 — 使用 zod + react-hook-form，使用 shadcn Label 组件
  - [x] SubTask 21.2: Register 页面 — 使用 zod + react-hook-form，统一密码验证标准（8位+大小写+数字）
  - [x] SubTask 21.3: Deployments 创建/编辑表单 — 使用 zod + react-hook-form
  - [x] SubTask 21.4: Profile 页面 — 使用 react-query 统一数据获取

- [x] Task 22: 图表组件暗色模式适配
  - [x] SubTask 22.1: LineChartComponent — Tooltip 使用 CSS 变量背景色，网格线使用 border 色
  - [x] SubTask 22.2: BarChartComponent — 同上
  - [x] SubTask 22.3: PieChartComponent — 同上
  - [x] SubTask 22.4: 所有图表添加空数据状态处理

## Phase 11: 前端 UI 重构 — 功能补全

- [x] Task 23: 创建审计日志页面
  - [x] SubTask 23.1: 创建后端 handler/service（如不存在）
  - [x] SubTask 23.2: 创建前端 `pages/AuditLogs.tsx`（列表 + 筛选 + 分页）
  - [x] SubTask 23.3: 添加路由和侧边栏菜单项
  - [x] SubTask 23.4: 创建前端 service `services/audit.ts`

- [x] Task 24: 补全监控页面功能
  - [x] SubTask 24.1: 实现告警规则创建/编辑表单对话框
  - [x] SubTask 24.2: 修复告警列表分页
  - [x] SubTask 24.3: MetricCard 使用语义颜色区分

- [x] Task 25: 补全其他页面缺失功能
  - [x] SubTask 25.1: DeploymentDetail — 修复图标语义（环境用 Globe，状态用 Activity）
  - [x] SubTask 25.2: PipelineDetail — 修复触发构建时分支参数传递，修复概览卡片分支显示
  - [x] SubTask 25.3: Dashboard — 底部状态卡片"查看详情"按钮添加导航，修复资源使用图表数据 key
  - [x] SubTask 25.4: Settings — 测试连接改为调用实际 API

## Task Dependencies
- Phase 1-7（基础设施）之间可并行
- Phase 8-11（前端）之间可并行
- Task 23（审计日志）依赖后端 handler 存在
- Task 24.1（告警规则编辑）依赖后端 API 存在
- Task 18（分页组件）应在 Task 20（列表页修复）之前完成
- Task 17（PageHeader）应在 Task 20（列表页修复）之前完成
