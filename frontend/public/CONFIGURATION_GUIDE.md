# CI/CD 平台配置指南

本文档详细介绍如何配置和使用 CI/CD 平台，包括快速开始、详细配置、功能讲解和扩展说明。

---

## 📑 目录

1. [快速开始](#快速开始)
2. [系统架构](#系统架构)
3. [详细配置](#详细配置)
4. [功能模块](#功能模块)
5. [扩展开发](#扩展开发)
6. [常见问题](#常见问题)

---

## 快速开始

### 环境要求

| 组件 | 版本要求 | 说明 |
|------|---------|------|
| Go | 1.21+ | 后端运行环境 |
| Node.js | 18+ | 前端运行环境 |
| PostgreSQL | 14+ | 主数据库 |
| Docker | 20+ | 容器化部署（可选） |
| Kubernetes | 1.25+ | 生产环境部署（可选） |

### 一键初始化

```bash
# 运行快速启动脚本（自动检查环境、安装依赖、初始化数据库）
./quick-start.sh
```

### 手动启动步骤

**步骤 1: 准备数据库**

```bash
# 使用 Docker 启动 PostgreSQL
docker run -d \
  --name cicd-postgres \
  -e POSTGRES_USER=cicd \
  -e POSTGRES_PASSWORD=cicd123 \
  -e POSTGRES_DB=cicd_platform \
  -p 5432:5432 \
  postgres:15-alpine

# 或者使用本地 PostgreSQL
sudo -u postgres psql -c "CREATE USER cicd WITH PASSWORD 'cicd123';"
sudo -u postgres psql -c "CREATE DATABASE cicd_platform OWNER cicd;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cicd_platform TO cicd;"
```

**步骤 2: 配置后端**

```bash
cd backend

# 检查配置文件
cat configs/config.yaml

# 如果不存在，创建默认配置
mkdir -p configs
cat > configs/config.yaml << 'EOF'
server:
  port: 8080
  mode: debug

database:
  host: localhost
  port: 5432
  user: cicd
  password: cicd123
  dbname: cicd_platform
  sslmode: disable

jwt:
  secret: your-super-secret-key-change-in-production
  expire: 24h
EOF
```

**步骤 3: 初始化数据库**

```bash
cd backend

# 安装依赖
go mod download

# 初始化表结构和测试数据
go run cmd/seed/main.go
```

**步骤 4: 启动服务**

```bash
# 终端 1: 启动后端
cd backend && go run cmd/server/main.go

# 终端 2: 启动前端
cd frontend && npm install && npm run dev
```

**步骤 5: 访问系统**

- 前端地址: http://localhost:3000
- 后端 API: http://localhost:8080

### 默认账号

| 用户名 | 密码 | 角色 |
|-------|------|------|
| admin | password123 | 系统管理员 |
| developer1 | password123 | 开发人员 |
| devops | password123 | 运维人员 |
| viewer | password123 | 只读用户 |

---

## 🚀 真正开始使用

### 为什么没有数据？

如果您登录后看不到数据，可能是因为：

1. **数据库未初始化** - 运行 `cd backend && go run cmd/seed/main.go`
2. **后端服务未启动** - 确保后端在 `http://localhost:8080` 运行
3. **数据库连接失败** - 检查 PostgreSQL 是否运行，配置是否正确

### 验证系统状态

```bash
# 检查后端是否运行
curl http://localhost:8080/api/v1/health

# 检查数据库连接
cd backend && go run cmd/seed/main.go

# 检查前端是否运行
curl http://localhost:3000
```

### 功能模块数据来源

| 功能模块 | 数据来源 | 如何获取真实数据 |
|---------|---------|----------------|
| Dashboard 统计 | 数据库 | 运行 seed 脚本初始化 |
| 流水线管理 | 数据库 | 运行 seed 脚本初始化 |
| 代码仓库 | 数据库 | 运行 seed 脚本初始化 |
| 部署管理 | 数据库 + Kubernetes | 需要 Kubernetes 集群连接 |
| 镜像管理 | Harbor API | 需要 Harbor 配置 |
| 监控告警 | Prometheus API | 需要 Prometheus 配置 |

### 最小可用配置

要使系统基本可用，您只需要：

1. **PostgreSQL 数据库** - 存储用户、流水线、部署等数据
2. **运行 seed 脚本** - 初始化测试数据

```bash
# 最小启动命令
docker run -d --name cicd-postgres -e POSTGRES_USER=cicd -e POSTGRES_PASSWORD=cicd123 -e POSTGRES_DB=cicd_platform -p 5432:5432 postgres:15-alpine
cd backend && go run cmd/seed/main.go && go run cmd/server/main.go
cd frontend && npm install && npm run dev
```

### 生产环境配置

要使用完整功能，还需要配置：

1. **Kubernetes 集群** - 用于部署管理
2. **Harbor 镜像仓库** - 用于镜像管理
3. **Prometheus** - 用于监控告警

详见下方"详细配置"章节

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Dashboard│ │Pipelines│ │Deployments│ │Settings│           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
└───────┼──────────┼──────────┼──────────┼────────────────────┘
        │          │          │          │
        └──────────┴──────────┴──────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     后端 API (Go + Gin)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │Pipeline │ │Deployment│ │Settings│           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
└───────┼──────────┼──────────┼──────────┼────────────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ PostgreSQL  │ │ Kubernetes  │ │   Harbor    │ │ Prometheus  │
│   数据库    │ │   集群      │ │  镜像仓库   │ │   监控      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 详细配置

### 1. 数据库配置

#### 配置文件位置
`backend/configs/config.yaml`

```yaml
database:
  host: localhost          # 数据库主机
  port: 5432              # 端口
  user: cicd              # 用户名
  password: cicd123       # 密码
  dbname: cicd_platform   # 数据库名
  sslmode: disable        # SSL 模式
  max_open_conns: 100     # 最大连接数
  max_idle_conns: 10      # 最大空闲连接
  conn_max_lifetime: 1h   # 连接最大生命周期
```

#### 使用 Docker 启动 PostgreSQL

```bash
docker run -d \
  --name cicd-postgres \
  -e POSTGRES_USER=cicd \
  -e POSTGRES_PASSWORD=cicd123 \
  -e POSTGRES_DB=cicd_platform \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 初始化数据库

```bash
# 创建表结构
cd backend
go run cmd/server/main.go  # 自动迁移

# 导入测试数据
go run cmd/seed/main.go
```

---

### 2. Kubernetes 集群配置

#### 前提条件
- 已有 Kubernetes 集群
- 已配置 kubeconfig 文件

#### 配置步骤

**步骤 1: 配置 kubeconfig**

```bash
# 方式一：设置环境变量
export KUBECONFIG=/path/to/kubeconfig

# 方式二：复制到默认位置
cp /path/to/kubeconfig ~/.kube/config
```

**步骤 2: 验证连接**

```bash
kubectl cluster-info
kubectl get nodes
```

**步骤 3: 创建服务账号**

```bash
# 创建命名空间
kubectl create namespace cicd-system

# 创建服务账号
kubectl create serviceaccount cicd-deployer -n cicd-system

# 授予集群管理员权限（生产环境请使用最小权限）
kubectl create clusterrolebinding cicd-deployer-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=cicd-system:cicd-deployer

# 获取 Token
kubectl create token cicd-deployer -n cicd-system --duration=87600h
```

**步骤 4: 在系统中配置**

进入 **系统设置 → Kubernetes集群**，填写：
- 集群名称
- API Server 地址
- Token

---

### 3. Harbor 镜像仓库配置

#### 前提条件
- 已部署 Harbor 镜像仓库
- 已创建项目和用户

#### 配置步骤

**步骤 1: 获取 Harbor 信息**

```bash
# Harbor 地址
HARBOR_URL="https://harbor.example.com"

# 用户名和密码
HARBOR_USER="admin"
HARBOR_PASSWORD="Harbor12345"
```

**步骤 2: 创建项目**

```bash
# 使用 API 创建项目
curl -X POST "$HARBOR_URL/api/v2.0/projects" \
  -u "$HARBOR_USER:$HARBOR_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"project_name": "production", "public": false}'
```

**步骤 3: 在系统中配置**

进入 **系统设置 → 镜像仓库**，填写：
- Harbor 地址
- 用户名
- 密码
- 默认项目

**步骤 4: 测试连接**

点击 **测试连接** 按钮验证配置是否正确。

---

### 4. Prometheus 监控配置

#### 前提条件
- 已部署 Prometheus
- 已配置 ServiceMonitor

#### 配置步骤

**步骤 1: 部署 Prometheus**

```bash
# 使用 Helm 部署
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace
```

**步骤 2: 获取 Prometheus 地址**

```bash
# Port Forward
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090

# 或使用 Service 地址
PROMETHEUS_URL="http://prometheus-operated.monitoring.svc.cluster.local:9090"
```

**步骤 3: 配置告警规则**

创建告警规则文件：

```yaml
# custom-alerts.yaml
groups:
- name: cicd-alerts
  rules:
  - alert: HighBuildFailureRate
    expr: rate(build_failures_total[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "构建失败率过高"
      description: "最近5分钟构建失败率超过10%"
```

---

### 5. 通知配置

#### 邮件通知 (SMTP)

```yaml
# 在系统设置中配置
smtp_host: smtp.example.com
smtp_port: 587
smtp_user: noreply@example.com
smtp_password: your-password
```

#### 钉钉通知

```bash
# 创建钉钉机器人
# 1. 进入钉钉群 → 群设置 → 智能群助手 → 添加机器人
# 2. 选择"自定义"机器人
# 3. 安全设置选择"自定义关键词"，输入"CICD"
# 4. 复制 Webhook 地址

# 在系统设置中配置
dingtalk_webhook: https://oapi.dingtalk.com/robot/send?access_token=xxx
```

#### 企业微信通知

```bash
# 创建企业微信机器人
# 1. 进入企业微信群 → 群设置 → 群机器人 → 添加
# 2. 复制 Webhook 地址

# 在系统设置中配置
wechat_webhook: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
```

---

## 功能模块

### 1. 仪表盘 (Dashboard)

#### 功能说明
- 显示系统整体运行状态
- 构建趋势图表
- 部署分布统计
- 资源使用情况

#### 数据来源
- 构建数据：从数据库查询
- 部署数据：从 Kubernetes 获取
- 监控数据：从 Prometheus 获取

#### 配置要点
```yaml
# 时间范围支持
- 7天
- 30天
- 90天
```

---

### 2. 流水线管理 (Pipelines)

#### 功能说明
- 创建和管理 CI/CD 流水线
- 触发构建
- 查看构建历史和日志

#### 流水线配置示例

```yaml
stages:
  - name: install
    image: node:18
    script:
      - npm install
    timeout: 300
    
  - name: build
    image: node:18
    script:
      - npm run build
    artifacts:
      - dist/
      
  - name: test
    image: node:18
    script:
      - npm test
    retry: 2
    
  - name: docker-build
    image: docker:latest
    script:
      - docker build -t myapp:$BUILD_ID .
      - docker push myapp:$BUILD_ID
    when: success
    
  - name: deploy
    image: alpine/kubectl
    script:
      - kubectl set image deployment/myapp myapp=myapp:$BUILD_ID
    environment: production
```

#### 触发方式
1. **手动触发** - 点击"触发构建"按钮
2. **Webhook 触发** - Git 推送自动触发
3. **定时触发** - Cron 表达式配置

---

### 3. 代码仓库 (Repositories)

#### 支持的 Git 平台
- GitHub
- GitLab
- Gitee
- 自建 Git 服务

#### 配置步骤

1. **添加仓库**
   - 填写仓库 URL
   - 选择类型（GitHub/GitLab/Gitee）
   - 配置访问凭证（私有仓库需要）

2. **配置 Webhook**
   - 复制 Webhook URL
   - 在 Git 平台添加 Webhook
   - 选择触发事件（push, merge request 等）

3. **测试连接**
   - 点击"测试连接"验证配置

---

### 4. 部署管理 (Deployments)

#### 支持的部署策略

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| 滚动更新 | 逐步替换 Pod | 常规更新 |
| 灰度发布 | 部分流量切换 | 风险较高的更新 |
| 蓝绿部署 | 两套环境切换 | 零停机更新 |

#### 部署配置示例

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: myapp
        image: harbor.example.com/production/myapp:v1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

#### 环境管理
- **dev** - 开发环境
- **test** - 测试环境
- **prod** - 生产环境

---

### 5. 镜像管理 (Images)

#### 功能说明
- 查看镜像列表
- 镜像漏洞扫描
- 镜像标签管理

#### 漏洞扫描

支持的扫描器：
- Trivy
- Clair
- Harbor 内置扫描器

#### 扫描结果分级

| 级别 | 说明 | 处理建议 |
|------|------|---------|
| Critical | 严重漏洞 | 必须修复 |
| High | 高危漏洞 | 建议修复 |
| Medium | 中危漏洞 | 可选修复 |
| Low | 低危漏洞 | 可忽略 |

---

### 6. 监控告警 (Monitoring)

#### 监控指标

| 指标类型 | 示例 |
|---------|------|
| CPU 使用率 | `rate(container_cpu_usage_seconds_total[5m])` |
| 内存使用率 | `container_memory_usage_bytes / container_spec_memory_limit_bytes` |
| 网络流量 | `rate(container_network_receive_bytes_total[5m])` |
| 请求延迟 | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))` |

#### 告警规则配置

```yaml
groups:
- name: application-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "HTTP 5xx 错误率过高"
```

---

### 7. 用户管理 (Users)

#### 角色权限

| 角色 | 权限 |
|------|------|
| admin | 所有权限 |
| devops | 流水线、部署、监控管理 |
| developer | 流水线管理、代码仓库 |
| viewer | 只读权限 |

#### 用户操作
- 创建用户
- 编辑用户信息
- 分配角色
- 禁用/启用用户

---

### 8. 系统设置 (Settings)

#### 设置分类

1. **基本设置**
   - 系统名称
   - 系统描述
   - 默认命名空间

2. **Kubernetes 配置**
   - 集群名称
   - API Server 地址
   - 可用命名空间

3. **镜像仓库配置**
   - Harbor 地址
   - 访问凭证
   - 默认项目

4. **通知配置**
   - SMTP 邮件
   - 钉钉 Webhook
   - 企业微信 Webhook

5. **安全设置**
   - 镜像扫描开关
   - 漏洞级别阈值
   - 审计日志

---

## 扩展开发

### 1. 添加新的 API 端点

**步骤 1: 创建 Model**

```go
// backend/internal/models/custom.go
package models

import "gorm.io/gorm"

type CustomModel struct {
    gorm.Model
    Name        string `json:"name" gorm:"size:100;not null"`
    Description string `json:"description"`
}
```

**步骤 2: 创建 Service**

```go
// backend/internal/services/custom_service.go
package services

type CustomService struct {
    db *gorm.DB
}

func NewCustomService(db *gorm.DB) *CustomService {
    return &CustomService{db: db}
}

func (s *CustomService) List() ([]models.CustomModel, error) {
    var items []models.CustomModel
    err := s.db.Find(&items).Error
    return items, err
}
```

**步骤 3: 创建 Handler**

```go
// backend/internal/handlers/custom_handler.go
package handlers

func (h *Handler) ListCustom(c *gin.Context) {
    items, err := h.customService.List()
    if err != nil {
        response.Error(c, 500, err.Error())
        return
    }
    response.Success(c, items)
}
```

**步骤 4: 添加路由**

```go
// backend/internal/router/router.go
custom := api.Group("/custom").Use(middleware.JWTAuth())
{
    custom.GET("", handlers.ListCustom)
}
```

---

### 2. 添加新的前端页面

**步骤 1: 创建页面组件**

```tsx
// frontend/src/pages/CustomPage.tsx
import { Card } from '@/components/ui/card'

export default function CustomPage() {
  return (
    <Card>
      <h1>Custom Page</h1>
    </Card>
  )
}
```

**步骤 2: 添加路由**

```tsx
// frontend/src/App.tsx
<Route path="custom" element={<CustomPage />} />
```

**步骤 3: 添加导航**

```tsx
// frontend/src/components/Layout.tsx
const menuItems = [
  // ...
  { key: '/custom', icon: <CustomIcon />, label: '自定义页面' },
]
```

---

### 3. 添加新的 UI 组件

```bash
# 使用 shadcn/ui CLI
cd frontend
npx shadcn@latest add [component-name]
```

---

## 常见问题

### Q1: 登录后提示"请求的资源不存在"

**原因**: 数据库未初始化

**解决方案**:
```bash
cd backend
go run cmd/seed/main.go
```

---

### Q2: 页面显示空白

**原因**: API 调用失败，前端未正确处理错误

**解决方案**:
1. 检查后端服务是否运行
2. 检查浏览器控制台错误
3. 点击"刷新页面"或"返回"按钮

---

### Q3: Kubernetes 部署失败

**原因**: 权限不足或配置错误

**解决方案**:
```bash
# 检查服务账号权限
kubectl auth can-i list deployments --as=system:serviceaccount:cicd-system:cicd-deployer

# 检查 Token 是否过期
kubectl describe secret -n cicd-system
```

---

### Q4: Harbor 连接失败

**原因**: 证书问题或网络不通

**解决方案**:
```bash
# 测试连接
curl -k https://harbor.example.com/api/v2.0/systeminfo

# 如果是自签名证书，需要信任证书
# 或在配置中跳过证书验证
```

---

### Q5: Prometheus 无数据

**原因**: ServiceMonitor 未配置或标签不匹配

**解决方案**:
```bash
# 检查 Prometheus 是否发现目标
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# 访问 http://localhost:9090/targets

# 检查 ServiceMonitor 标签
kubectl get servicemonitor -n monitoring -o yaml
```

---

### Q6: 构建日志不显示

**原因**: WebSocket 连接失败

**解决方案**:
1. 检查后端 WebSocket 路由
2. 检查网络代理配置
3. 查看浏览器控制台 WebSocket 错误

---

## 附录

### API 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/login | 用户登录 |
| POST | /api/v1/auth/register | 用户注册 |
| GET | /api/v1/users | 用户列表 |
| GET | /api/v1/pipelines | 流水线列表 |
| POST | /api/v1/pipelines/:id/trigger | 触发构建 |
| GET | /api/v1/deployments | 部署列表 |
| POST | /api/v1/deployments/:id/deploy | 执行部署 |
| GET | /api/v1/images | 镜像列表 |
| GET | /api/v1/monitoring/metrics | 监控指标 |
| GET | /api/v1/settings | 系统设置 |

### 配置文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 后端配置 | backend/configs/config.yaml | 后端服务配置 |
| 前端配置 | frontend/vite.config.ts | 前端构建配置 |
| 测试数据 | test_program/mock_data.json | 模拟数据 |

---

## 联系支持

如有问题，请：
1. 查看日志文件：`logs/backend.log` 和 `logs/frontend.log`
2. 查看本文档的常见问题部分
3. 提交 Issue 到项目仓库
