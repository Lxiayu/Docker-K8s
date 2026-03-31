# PostgreSQL 数据库部署

## 概述

本目录包含 CI/CD 平台的 PostgreSQL 数据库部署配置，包括：
- PostgreSQL 主数据库部署
- 数据库初始化脚本
- 自动备份策略
- 监控和告警配置

## 目录结构

```
database/
├── namespace.yaml                    # 数据库命名空间
├── postgres/                         # PostgreSQL 主配置
│   ├── secret.yaml                  # 数据库密码和连接信息
│   ├── pvc.yaml                     # 持久化存储配置
│   ├── configmap.yaml               # PostgreSQL 配置文件
│   ├── configmap-init-scripts.yaml  # 数据库初始化脚本
│   ├── statefulset.yaml             # PostgreSQL StatefulSet
│   └── service.yaml                 # Service 配置
├── backup/                           # 备份配置
│   ├── cronjob.yaml                 # 定时备份任务
│   └── scripts.yaml                 # 备份恢复脚本
├── monitoring/                       # 监控配置
│   └── servicemonitor.yaml          # Prometheus 监控和告警规则
└── scripts/                          # 部署脚本
    ├── deploy.sh                    # 部署脚本
    ├── cleanup.sh                   # 清理脚本
    └── backup-restore.sh            # 备份恢复工具
```

## 部署步骤

### 前置要求

1. Kubernetes 集群 (v1.28+)
2. kubectl 已配置并连接到集群
3. StorageClass 支持动态存储分配
4. Prometheus Operator 已安装（用于监控）

### 快速部署

```bash
# 赋予脚本执行权限
chmod +x database/scripts/*.sh

# 执行部署
./database/scripts/deploy.sh
```

### 手动部署步骤

如果需要逐步部署：

```bash
# 1. 创建命名空间
kubectl apply -f database/namespace.yaml

# 2. 创建 Secret
kubectl apply -f database/postgres/secret.yaml

# 3. 创建 ConfigMap
kubectl apply -f database/postgres/configmap.yaml
kubectl apply -f database/postgres/configmap-init-scripts.yaml

# 4. 创建 PVC
kubectl apply -f database/postgres/pvc.yaml

# 5. 部署 PostgreSQL
kubectl apply -f database/postgres/service.yaml
kubectl apply -f database/postgres/statefulset.yaml

# 6. 等待 PostgreSQL 就绪
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n database --timeout=300s

# 7. 部署备份任务
kubectl apply -f database/backup/scripts.yaml
kubectl apply -f database/backup/cronjob.yaml

# 8. 部署监控
kubectl apply -f database/monitoring/servicemonitor.yaml
```

## 数据库配置

### 连接信息

- **主机**: postgres-service.database.svc.cluster.local
- **端口**: 5432
- **数据库**: cicd_platform
- **管理员用户**: cicd_admin
- **只读用户**: cicd_readonly
- **读写用户**: cicd_readwrite
- **备份用户**: backup_user

### 连接数据库

```bash
# 进入数据库容器
kubectl exec -it -n database statefulset/postgres -- psql -U cicd_admin -d cicd_platform

# 或使用临时 Pod 连接
kubectl run pg-client --rm -it --image=postgres:15.4-alpine --restart=Never -- \
  psql -h postgres-service.database.svc.cluster.local -U cicd_admin -d cicd_platform
```

### 应用连接配置

应用可以使用 Secret 中的连接信息：

```yaml
envFrom:
- secretRef:
    name: postgres-app-credentials
```

环境变量：
- `CICD_DB_HOST`: 数据库主机
- `CICD_DB_PORT`: 数据库端口
- `CICD_DB_NAME`: 数据库名称
- `CICD_DB_USER`: 数据库用户
- `CICD_DB_PASSWORD`: 数据库密码
- `DATABASE_URL`: 完整的数据库连接 URL

## 数据库架构

初始化脚本会创建以下 Schema：

1. **users**: 用户和权限管理
   - users: 用户表
   - roles: 角色表
   - user_roles: 用户角色关联表

2. **pipelines**: 流水线管理
   - pipelines: 流水线定义
   - executions: 流水线执行记录

3. **projects**: 项目管理
   - projects: 项目表

4. **deployments**: 部署管理
   - deployments: 部署记录

5. **audit**: 审计日志
   - audit_logs: 审计日志表

## 备份策略

### 自动备份

1. **每日备份**: 每天凌晨 2:00 执行
   - 保留 30 天
   - 存储路径: `/backup/cicd_platform_YYYYMMDD_HHMMSS.sql.gz`

2. **每周备份**: 每周日凌晨 3:00 执行
   - 保留 90 天
   - 存储路径: `/backup/weekly/cicd_platform_weekly_YYYYMMDD_HHMMSS.sql.gz`

### 手动备份

```bash
# 创建手动备份
./database/scripts/backup-restore.sh backup

# 或使用 kubectl
kubectl create job --from=cronjob/postgres-backup manual-backup-$(date +%s) -n database
```

### 查看备份列表

```bash
./database/scripts/backup-restore.sh list
```

### 恢复数据

```bash
# 恢复指定备份
./database/scripts/backup-restore.sh restore /backup/cicd_platform_20240101_020000.sql.gz
```

### 下载备份

```bash
# 下载备份到本地
./database/scripts/backup-restore.sh download /backup/cicd_platform_20240101_020000.sql.gz
```

## 监控和告警

### 监控指标

PostgreSQL Exporter 会采集以下指标：
- 连接数
- 数据库大小
- 复制延迟
- 死锁数量
- 慢查询统计
- 事务统计

### 告警规则

配置了以下告警规则：

1. **PostgresInstanceDown**: PostgreSQL 实例宕机（严重）
2. **PostgresConnectionsHigh**: 连接数超过 80%（警告）
3. **PostgresReplicationLag**: 复制延迟超过 30 秒（警告）
4. **PostgresDeadlocks**: 检测到死锁（警告）
5. **PostgresSlowQueries**: 平均查询时间超过 1 秒（警告）
6. **PostgresDiskUsage**: 数据库大小超过 40GB（警告）

### 查看 Grafana 监控

在 Grafana 中导入 PostgreSQL 监控面板：
- Dashboard ID: 9628 (PostgreSQL Database)

## 性能优化

PostgreSQL 配置已针对以下场景优化：
- 最大连接数: 200
- 共享缓冲区: 512MB
- 有效缓存大小: 1536MB
- 工作内存: 2621kB
- WAL 缓冲区: 16MB

根据实际负载调整 `configmap.yaml` 中的参数。

## 安全配置

1. **密码加密**: 所有密码存储在 Kubernetes Secret 中
2. **访问控制**: 配置了不同权限级别的用户
3. **连接加密**: 支持 TLS 连接（需配置证书）
4. **审计日志**: 记录所有 DDL 操作

## 故障排查

### 查看 Pod 状态

```bash
kubectl get pods -n database
kubectl describe pod <pod-name> -n database
```

### 查看日志

```bash
# PostgreSQL 日志
kubectl logs -n database -l app.kubernetes.io/name=postgresql

# 备份任务日志
kubectl logs -n database job/<job-name>
```

### 连接问题

```bash
# 测试连接
kubectl run pg-test --rm -it --image=postgres:15.4-alpine --restart=Never -- \
  psql -h postgres-service.database.svc.cluster.local -U cicd_admin -d cicd_platform -c "SELECT version();"
```

### 存储问题

```bash
# 查看 PVC 状态
kubectl get pvc -n database
kubectl describe pvc postgres-pvc -n database
```

## 清理部署

```bash
# 删除所有资源（包括数据）
./database/scripts/cleanup.sh
```

⚠️ **警告**: 清理操作会删除所有数据，请确保已备份重要数据！

## 配置修改

### 修改密码

1. 编辑 Secret:
```bash
kubectl edit secret postgres-secret -n database
```

2. 重启 PostgreSQL:
```bash
kubectl rollout restart statefulset/postgres -n database
```

### 修改 PostgreSQL 配置

1. 编辑 ConfigMap:
```bash
kubectl edit configmap postgres-config -n database
```

2. 重启 PostgreSQL:
```bash
kubectl rollout restart statefulset/postgres -n database
```

### 扩容存储

1. 编辑 PVC:
```bash
kubectl edit pvc postgres-pvc -n database
```

2. 增加 storage 大小（需要 StorageClass 支持扩容）

## 高可用配置（可选）

如需高可用配置，可以考虑：
1. 使用 PostgreSQL Operator (如 Zalando Postgres Operator)
2. 配置流复制和故障转移
3. 使用 PgBouncer 连接池

## 相关文档

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/15/index.html)
- [PostgreSQL Exporter](https://github.com/prometheus-community/postgres_exporter)
- [Kubernetes StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
