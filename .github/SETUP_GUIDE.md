# GitHub Actions 设置指南

## 概述

本指南详细介绍如何设置GitHub Actions工作流，使整个CI/CD平台完全依托于GitHub Actions运行，实现真正的开箱即用。

## 前提条件

1. **GitHub账号**：拥有一个GitHub账号
2. **Kubernetes集群**：准备一个Kubernetes集群（EKS、GKE、AKS或自托管）
3. **Docker Hub账号**：用于存储Docker镜像
4. **域名**（可选）：用于访问应用

## 1. 仓库设置

### 1.1 Fork仓库

1. 访问原始仓库
2. 点击右上角的"Fork"按钮
3. 选择您的GitHub账号作为目标

### 1.2 设置Secrets

进入仓库 → Settings → Secrets and variables → Actions，添加以下Secrets：

| Secret名称 | 描述 | 示例值 |
|-----------|------|--------|
| `KUBE_CONFIG` | Kubernetes集群配置（base64编码） | `cat ~/.kube/config | base64` |
| `DOCKER_USERNAME` | Docker Hub用户名 | `your-docker-username` |
| `DOCKER_PASSWORD` | Docker Hub密码或访问令牌 | `your-docker-password` |
| `DATABASE_PASSWORD` | 数据库密码 | `your-database-password` |
| `JWT_SECRET` | JWT密钥 | `your-jwt-secret` |

## 2. Kubernetes集群准备

### 2.1 集群要求

- 至少2个节点
- 每个节点至少2GB内存
- 至少20GB磁盘空间

### 2.2 安装必要组件

```bash
# 安装ingress-nginx
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# 安装cert-manager（可选，用于HTTPS）
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### 2.3 创建命名空间

```bash
# 创建CI/CD平台命名空间
kubectl create namespace cicd-dev
kubectl create namespace cicd-test
kubectl create namespace cicd-prod
```

### 2.4 创建Secrets

```bash
# 创建数据库密码Secret
kubectl create secret generic database-secret \
  --from-literal=password=your-database-password \
  -n cicd-dev

# 创建JWT密钥Secret
kubectl create secret generic jwt-secret \
  --from-literal=secret=your-jwt-secret \
  -n cicd-dev

# 为其他环境创建相同的Secrets
kubectl create secret generic database-secret \
  --from-literal=password=your-database-password \
  -n cicd-test

kubectl create secret generic jwt-secret \
  --from-literal=secret=your-jwt-secret \
  -n cicd-test

kubectl create secret generic database-secret \
  --from-literal=password=your-database-password \
  -n cicd-prod

kubectl create secret generic jwt-secret \
  --from-literal=secret=your-jwt-secret \
  -n cicd-prod
```

## 3. 数据库部署

### 3.1 部署PostgreSQL

```bash
# 部署PostgreSQL
kubectl apply -f database/postgres/ -n cicd-dev

# 为其他环境部署PostgreSQL
kubectl apply -f database/postgres/ -n cicd-test
kubectl apply -f database/postgres/ -n cicd-prod
```

### 3.2 初始化数据库

```bash
# 等待PostgreSQL Pod就绪
kubectl wait pod -l app=postgres -n cicd-dev --for=condition=ready --timeout=120s

# 执行初始化脚本
kubectl cp database/init/init.sql postgres-0:/tmp/init.sql -n cicd-dev
kubectl exec postgres-0 -n cicd-dev -- psql -U postgres -f /tmp/init.sql

# 执行测试数据脚本（可选）
kubectl cp database/init/test-data.sql postgres-0:/tmp/test-data.sql -n cicd-dev
kubectl exec postgres-0 -n cicd-dev -- psql -U postgres -f /tmp/test-data.sql
```

## 4. 运行GitHub Actions工作流

### 4.1 首次部署

1. 进入GitHub仓库 → Actions → Full CI/CD Pipeline
2. 点击"Run workflow"
3. 选择环境：`dev`
4. 选择操作：`deploy`
5. 点击"Run workflow"

### 4.2 监控部署

- 在GitHub Actions界面查看工作流执行状态
- 查看Kubernetes资源状态：
  ```bash
  kubectl get all -n cicd-dev
  ```

### 4.3 访问应用

```bash
# 获取前端服务地址
FRONTEND_IP=$(kubectl get service cicd-frontend -n cicd-dev -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "前端地址: http://$FRONTEND_IP"

# 获取后端服务地址
BACKEND_IP=$(kubectl get service cicd-backend -n cicd-dev -o jsonpath='{.spec.clusterIP}')
echo "后端API地址: http://$BACKEND_IP:8080"
```

## 5. 日常使用

### 5.1 代码更新

1. 推送代码到 `develop` 分支
2. GitHub Actions会自动构建和部署到开发环境

### 5.2 测试环境部署

1. 创建PR从 `develop` 到 `main`
2. GitHub Actions会自动构建和部署到测试环境

### 5.3 生产环境部署

1. 合并PR到 `main` 分支
2. GitHub Actions会自动构建和部署到生产环境

### 5.4 回滚操作

1. 进入GitHub仓库 → Actions → Full CI/CD Pipeline
2. 点击"Run workflow"
3. 选择环境
4. 选择操作：`rollback`
5. 点击"Run workflow"

## 6. 监控和日志

### 6.1 GitHub Actions日志

- 所有构建、测试、部署操作都有详细日志
- 可以查看每一步的执行状态

### 6.2 Kubernetes监控

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

# 查看事件
kubectl get events -n cicd-<environment>
```

## 7. 故障排查

### 7.1 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|---------|----------|
| 部署失败 | Kubernetes集群资源不足 | 增加集群资源或减少应用副本数 |
| 服务不可访问 | Ingress配置错误 | 检查Ingress配置和网络连接 |
| 数据库连接失败 | 数据库密码错误 | 检查数据库Secret配置 |
| 构建失败 | 依赖安装失败 | 检查依赖配置和网络连接 |

### 7.2 调试技巧

```bash
# 查看Pod详细信息
kubectl describe pod -n cicd-<environment> <pod-name>

# 进入Pod查看
kubectl exec -it -n cicd-<environment> <pod-name> -- /bin/bash

# 查看配置映射
kubectl get configmaps -n cicd-<environment>

# 查看Secrets
kubectl get secrets -n cicd-<environment>
```

## 8. 最佳实践

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

4. **监控**：
   - 配置Prometheus和Grafana监控
   - 设置告警规则
   - 定期查看日志

## 9. 结论

通过完全依托于GitHub Actions工作流，您可以：

- **专注于代码开发**：无需担心环境配置
- **加速开发周期**：自动化的CI/CD流程
- **提高可靠性**：标准化的部署流程
- **降低维护成本**：集中化的配置管理
- **实现真正的开箱即用**：一键部署整个系统

这种方法完全解决了本地配置复杂的问题，让您可以专注于核心业务逻辑的开发，而将基础设施和部署管理交给自动化流程处理。