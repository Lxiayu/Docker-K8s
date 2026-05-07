# 验证清单

## Docker 镜像安全
- [x] `frontend/.dockerignore` 存在且排除 node_modules, dist, .git
- [x] `backend/.dockerignore` 存在且排除 bin/, vendor/, .git
- [x] 前端 Dockerfile 使用 `npm ci` 而非 `npm install`
- [x] 前端 Dockerfile 基础镜像版本固定（非 :latest）
- [x] 前端 Dockerfile 容器以非 root 用户运行
- [x] 前端 Dockerfile 包含 HEALTHCHECK 指令
- [x] 后端 Dockerfile 基础镜像版本固定（非 :latest）
- [x] 后端 Dockerfile 容器以非 root 用户运行

## K8s 安全与可靠性
- [x] 所有 Deployment 包含 pod 级 securityContext（runAsNonRoot: true）
- [x] 所有 Deployment 包含 container 级 securityContext（allowPrivilegeEscalation: false）
- [x] backend PDB 存在且配置 minAvailable: 1
- [x] frontend PDB 存在且配置 minAvailable: 1
- [x] backend HPA 存在且配置合理指标
- [x] frontend HPA 存在且配置合理指标
- [x] database namespace 有 NetworkPolicy 限制访问
- [x] Redis NetworkPolicy 限制仅 cicd-system 可访问
- [x] Redis 使用 PVC 持久化而非 emptyDir
- [x] backend ConfigMap 不包含明文密码
- [x] pg_hba.conf 使用 scram-sha-256 而非 trust
- [x] pg_hba.conf host 访问限制为集群 CIDR

## CI/CD 工作流
- [x] GitHub Actions workflow 有 permissions 声明
- [x] test job 在 build job 之前运行
- [x] 前端测试不再使用 `|| true` 允许失败
- [x] PR 事件不触发 deploy job
- [x] workflow 有 concurrency 控制
- [x] deploy job 有 environment 声明
- [x] Trivy Action 使用固定版本而非 @master
- [x] gosec 使用固定版本
- [x] test job 有 Go 和 npm 缓存
- [x] artifact 有 retention-days 设置
- [x] rollback 验证包含 HTTP 健康检查

## 后端增强
- [x] /ready 端点实际检查 PostgreSQL 连通性
- [x] /ready 端点实际检查 Redis 连通性
- [x] /health 端点包含 uptime 信息
- [x] login 端点有速率限制保护
- [x] CORS 配置不是 AllowOrigins: *

## Harbor
- [x] GC CronJob 执行实际的垃圾回收（非空操作）
- [x] RBAC namespace 与 Harbor namespace 一致
- [x] 审计日志已开启

## 监控告警
- [x] custom-business-metrics.yaml 使用实际的 CI/CD 平台指标
- [x] Grafana 有应用级 Dashboard

## 脚本修复
- [x] start.sh 不包含硬编码密码
- [x] quick-start.sh 不引用不存在的路径
- [x] stop.sh 有超时和 SIGKILL 回退
- [x] deploy-all.sh 不打印默认凭证
- [x] 日志栈 StorageClass 不与其他 StorageClass 冲突

## 前端 UI — Layout 与设计系统
- [x] 侧边栏使用语义 CSS 变量色彩（非硬编码 bg-slate-900）
- [x] 激活菜单项有左侧蓝色指示器
- [x] 侧边栏折叠时菜单项显示 tooltip
- [x] 主内容区使用 bg-background 而非硬编码颜色
- [x] 存在面包屑导航组件
- [x] 侧边栏包含 Profile 路由
- [x] 存在统一的 PageHeader 组件
- [x] 所有页面标题统一为 text-2xl font-bold + 描述

## 前端 UI — 列表页统一
- [x] 存在统一分页组件 Pagination
- [x] 存在统一空状态组件 EmptyState
- [x] Pipelines 页面状态列使用 Badge 组件
- [x] Pipelines 页面有搜索功能
- [x] Deployments 页面编辑功能已实现
- [x] Deployments 页面有标题描述
- [x] Deployments 状态翻译为中文
- [x] Images 页面仓库选择从 API 动态获取
- [x] Users 页面有搜索/筛选功能
- [x] Repositories 页面无 Hook 规则违反

## 前端 UI — 表单与图表
- [x] Login 页面使用 zod + react-hook-form
- [x] Register 页面使用 zod + react-hook-form
- [x] Register 密码验证标准统一（8位+大小写+数字）
- [x] Deployments 表单使用 zod + react-hook-form
- [x] Profile 页面使用 react-query
- [x] 图表 Tooltip 使用 CSS 变量背景色
- [x] 图表网格线使用 border 色
- [x] 图表有空数据状态处理

## 前端 UI — 功能补全
- [x] 存在审计日志页面（AuditLogs）
- [x] 监控页面有告警规则创建/编辑表单
- [x] 监控告警列表有分页
- [x] MetricCard 使用语义颜色区分
- [x] DeploymentDetail 图标语义正确
- [x] PipelineDetail 触发构建时分支参数正确传递
- [x] Dashboard 底部状态卡片"查看详情"可点击导航
- [x] Dashboard 资源使用图表数据 key 正确
- [x] Settings 测试连接调用实际 API

## 暗色模式
- [x] 侧边栏在暗色模式下风格正确
- [x] 图表在暗色模式下可读性良好
- [x] 所有页面组件在暗色模式下无硬编码白色背景
