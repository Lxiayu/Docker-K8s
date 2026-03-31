# 云原生容器化CI/CD自动化部署系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/go-1.21+-green.svg)](https://golang.org)
[![React](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org)

一套完整的云原生容器化CI/CD自动化部署系统，实现从代码提交到生产部署的全流程自动化。

## 🎯 系统概述

本系统基于 Docker 和 Kubernetes 构建现代化的 CI/CD 平台，提供：

- **全流程自动化**：代码提交 → 镜像构建 → 测试验证 → 自动部署
- **多环境支持**：开发、测试、生产环境隔离与统一管理
- **高级部署策略**：滚动更新、灰度发布、自动回滚
- **实时监控告警**：Prometheus + Grafana 全方位监控
- **安全管理**：镜像漏洞扫描、RBAC 权限控制、审计日志
- **Web 可视化**：现代化前端界面，操作简单直观

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户界面层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Web控制台   │  │   CLI工具    │  │   API网关    │          │
│  │  (React)     │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        应用服务层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  流水线服务   │  │  部署服务    │  │  监控服务    │          │
│  │  (Go)        │  │  (Go)        │  │  (Go)        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  镜像服务    │  │  安全服务    │  │  通知服务    │          │
│  │  (Go)        │  │  (Go)        │  │  (Go)        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        基础设施层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Git仓库     │  │  Harbor仓库  │  │  K8s集群     │          │
│  │  (GitLab)    │  │  (v2.8+)     │  │  (v1.28+)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Prometheus  │  │    ELK       │  │    Vault     │          │
│  │  (监控)      │  │  (日志)      │  │  (密钥)      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 项目结构

```
Docker-K8s/
├── kubernetes/          # Kubernetes 集群配置
│   ├── kind/           # Kind 集群配置
│   ├── calico/         # 网络插件配置
│   ├── ingress/        # Ingress 控制器
│   ├── storage/        # 存储类配置
│   └── namespaces/     # 命名空间定义
├── harbor/             # Harbor 镜像仓库
│   ├── config/         # Harbor 配置
│   ├── certs/          # 证书配置
│   └── init/           # 初始化脚本
├── monitoring/         # 监控系统
│   ├── prometheus/     # Prometheus 配置
│   ├── grafana/        # Grafana 看板
│   └── alertmanager/   # 告警管理
├── logging/            # 日志系统
│   ├── elasticsearch/  # ES 配置
│   ├── fluent-bit/     # 日志采集
│   └── kibana/         # 日志查询
├── database/           # 数据库
│   └── postgres/       # PostgreSQL 配置
├── backend/            # 后端服务
│   ├── cmd/           # 应用入口
│   ├── internal/      # 业务代码
│   ├── pkg/           # 公共库
│   └── configs/       # 配置文件
├── frontend/           # 前端应用
│   ├── src/           # 源代码
│   ├── public/        # 静态资源
│   └── package.json   # 依赖配置
└── 产品需求文档.md      # 需求文档
```

## 🚀 快速开始

### 一键启动（推荐）

```bash
# 启动所有服务（前端 + 后端 + 数据库）
./start.sh

# 查看服务状态
./status.sh

# 停止所有服务
./stop.sh
```

启动完成后访问：
- **前端界面**: http://localhost:3000
- **后端 API**: http://localhost:8080
- **健康检查**: http://localhost:8080/health
- **数据库**: localhost:5432

### 手动启动

#### 1. 启动数据库

```bash
docker run -d --name cicd-postgres \
  -e POSTGRES_USER=cicd \
  -e POSTGRES_PASSWORD=cicd123 \
  -e POSTGRES_DB=cicd_platform \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 2. 启动后端服务

```bash
cd backend
go mod tidy
go build -o bin/server ./cmd/server
./bin/server
```

#### 3. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

## 📚 核心功能

### 1. 流水线管理

- 支持 YAML 和可视化方式定义流水线
- 多阶段编排和并行执行
- 手动审批节点
- 执行历史和日志查看

### 2. 代码管理

- 集成 GitLab/GitHub/Gitee
- Webhook 自动触发
- 多分支策略支持

### 3. 镜像构建

- Docker 多阶段构建
- 多平台镜像打包 (amd64/arm64)
- 构建缓存优化
- 自动标签生成

### 4. 部署管理

- 滚动更新 (Rolling Update)
- 灰度发布 (Canary)
- 蓝绿部署 (Blue-Green)
- 自动回滚
- 多环境管理

### 5. 监控告警

- Prometheus 指标采集
- Grafana 可视化看板
- 自定义告警规则
- 多渠道通知 (邮件/短信/钉钉/企业微信)

### 6. 安全管理

- Trivy 镜像漏洞扫描
- RBAC 权限控制
- 审计日志
- TLS 传输加密

## 🛠️ 技术栈

### 后端

- **语言**: Go 1.21+
- **框架**: Gin
- **ORM**: GORM
- **数据库**: PostgreSQL
- **缓存**: Redis
- **日志**: Zap
- **配置**: Viper
- **认证**: JWT

### 前端

- **框架**: React 18
- **语言**: TypeScript
- **UI**: Ant Design 5
- **构建**: Vite
- **路由**: React Router 6
- **状态**: Zustand
- **请求**: React Query + Axios

### 基础设施

- **容器**: Docker
- **编排**: Kubernetes
- **镜像仓库**: Harbor
- **监控**: Prometheus + Grafana
- **日志**: ELK Stack
- **密钥**: Vault

## 📖 文档

- [产品需求文档](产品需求文档.md)
- [后端开发文档](backend/README.md)
- [前端开发文档](frontend/README.md)
- [Kubernetes 部署文档](kubernetes/README.md)
- [Harbor 配置文档](harbor/README.md)
- [监控系统文档](monitoring/README.md)
- [日志系统文档](logging/README.md)
- [数据库文档](database/README.md)

## 🔧 开发指南

### 后端开发

```bash
cd backend

# 安装依赖
go mod download

# 运行开发服务器
make run

# 运行测试
make test

# 构建生产版本
make build
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📊 性能指标

| 指标 | 目标值 |
|------|--------|
| 流水线触发延迟 | ≤5秒 |
| 镜像构建时间 | ≤10分钟 |
| 部署时间 | ≤2分钟 |
| 回滚时间 | ≤2分钟 |
| 告警延迟 | ≤30秒 |
| 并发流水线 | 50+ |

## 🔒 安全特性

- ✅ TLS 1.3 全链路加密
- ✅ AES-256 数据加密存储
- ✅ JWT 身份认证
- ✅ RBAC 权限控制
- ✅ 镜像漏洞扫描
- ✅ 操作审计日志

## 📈 监控指标

- CPU/内存使用率
- 网络流量
- 磁盘 I/O
- 应用错误率
- 响应时间
- Pod 状态

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📝 License

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE) 文件

## 👥 作者

- 产品规划与架构设计
- 后端服务开发
- 前端界面开发
- 基础设施搭建

## 🙏 致谢

感谢以下开源项目：

- [Kubernetes](https://kubernetes.io/)
- [Docker](https://www.docker.com/)
- [Harbor](https://goharbor.io/)
- [Prometheus](https://prometheus.io/)
- [Grafana](https://grafana.com/)
- [Gin](https://gin-gonic.com/)
- [Ant Design](https://ant.design/)
