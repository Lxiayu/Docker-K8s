# GitHub Actions 完全运行指南

## 概述

本指南介绍如何完全依托于GitHub Actions工作流来运行整个CI/CD平台，实现真正的开箱即用，无需本地复杂配置。

## 优势

- **零本地配置**：无需在本地安装任何依赖
- **一键部署**：通过GitHub Actions界面一键部署
- **环境隔离**：不同环境完全隔离
- **自动扩展**：基于Kubernetes的自动扩缩容
- **完整功能**：包含所有CI/CD功能

## 快速开始

### 1. 准备工作

#### GitHub仓库设置
1. **Fork本仓库**到您自己的GitHub账号
2. **设置Secrets**：
   - 进入仓库 → Settings → Secrets and variables → Actions
   - 添加以下Secrets：
     - `KUBE_CONFIG`：Kubernetes集群配置（base64编码）
     - `DATABASE_PASSWORD`：数据库密码
     - `JWT_SECRET`：JWT密钥

#### Kubernetes集群
- 准备一个Kubernetes集群（EKS、GKE、AKS或自托管）
- 确保集群有足够的资源（至少2个节点，4GB内存）
- 安装必要的组件：
  - ingress-nginx
  - cert-manager（可选，用于HTTPS）

### 2. 首次部署

1. **基础设施部署**：
   - 进入GitHub仓库 → Actions → Full CI/CD Pipeline
   - 点击"Run workflow"
   - 选择环境：`dev`
   - 选择操作：`provision`
   - 点击"Run workflow"

2. **应用部署**：
   - 进入GitHub仓库 → Actions → Full CI/CD Pipeline
   - 点击"Run workflow"
   - 选择环境：`dev`
   - 选择操作：`deploy`
   - 点击"Run workflow"

3. **访问应用**：
   - 等待部署完成后，在工作流日志中查看服务地址
   - 前端：`http://<frontend-service-ip>`
   - 后端API：`http://<backend-service-ip>:8080`

### 3. 日常使用

#### 代码更新
1. **推送代码**到 `develop` 分支
2. GitHub Actions会自动构建和部署到开发环境

#### 测试环境部署
1. 创建PR从 `develop` 到 `main`
2. GitHub Actions会自动构建和部署到测试环境

#### 生产环境部署
1. 合并PR到 `main` 分支
2. GitHub Actions会自动构建和部署到生产环境

#### 回滚操作
1. 进入GitHub仓库 → Actions → Full CI/CD Pipeline
2. 点击"Run workflow"
3. 选择环境
4. 选择操作：`rollback`
5. 点击"Run workflow"

## 环境管理

### 环境隔离
- **开发环境** (`dev`)：用于开发测试
- **测试环境** (`test`)：用于集成测试
- **生产环境** (`prod`)：用于生产部署

### 资源管理
- 每个环境都有独立的命名空间
- 资源使用受到Kubernetes资源限制
- 支持自动扩缩容

## 监控和日志

### GitHub Actions日志
- 所有构建、测试、部署操作都有详细日志
- 可以查看每一步的执行状态

### Kubernetes监控
```bash
# 查看部署状态
kubectl get deployments -n cicd-<environment>

# 查看Pod状态
kubectl get pods -n cicd-<environment>

# 查看服务状态
kubectl get services -n cicd-<environment>

# 查看日志
kubectl logs -n cicd-<environment> deployment/cicd-backend
kubectl logs -n cicd-<environment> deployment/cicd-frontend
```

## 配置管理

### 环境变量
所有配置通过环境变量管理，主要包括：

#### 后端配置
- `SERVER_PORT`：后端服务端口
- `DATABASE_HOST`：数据库主机
- `DATABASE_PASSWORD`：数据库密码
- `JWT_SECRET`：JWT密钥
- `LOG_LEVEL`：日志级别

#### 前端配置
- `VITE_API_BASE_URL`：API基础URL
- `VITE_APP_TITLE`：应用标题
- `VITE_ENV`：环境名称

### 配置文件
- 后端：使用环境变量，无需本地配置文件
- 前端：使用`.env`文件，支持不同环境配置

## 常见问题

### 1. 部署失败
- **检查Kubernetes集群**：确保集群运行正常
- **检查资源**：确保集群有足够的资源
- **检查Secrets**：确保所有必要的Secrets都已设置

### 2. 服务不可访问
- **检查Ingress**：确保Ingress配置正确
- **检查服务**：确保服务正常运行
- **检查网络**：确保网络连接正常

### 3. 回滚失败
- **检查历史版本**：确保有可回滚的历史版本
- **检查权限**：确保GitHub Actions有足够的权限

## 最佳实践

1. **分支管理**：
   - `develop`：开发分支
   - `main`：稳定分支
   - 功能分支：`feature/*`

2. **部署策略**：
   - 开发环境：自动部署
   - 测试环境：PR触发
   - 生产环境：合并到main触发

3. **安全措施**：
   - 使用Secrets管理敏感信息
   - 定期更新依赖
   - 定期扫描镜像漏洞

## 结论

通过完全依托于GitHub Actions工作流，您可以：

- **专注于代码开发**：无需担心环境配置
- **加速开发周期**：自动化的CI/CD流程
- **提高可靠性**：标准化的部署流程
- **降低维护成本**：集中化的配置管理
- **实现真正的开箱即用**：一键部署整个系统

这种方法完全解决了本地配置复杂的问题，让您可以专注于核心业务逻辑的开发，而将基础设施和部署管理交给自动化流程处理。