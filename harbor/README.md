# Harbor 镜像仓库部署指南

## 概述

本目录包含 Harbor 镜像仓库的完整 Kubernetes 部署配置，支持：
- Harbor v2.8+ 企业级镜像仓库
- HTTPS 安全访问（自签名证书）
- Trivy 镜像漏洞扫描
- 自动垃圾回收策略
- 项目和用户权限管理

## 目录结构

```
harbor/
├── namespace.yaml              # 命名空间配置
├── deploy.sh                   # 部署脚本
├── uninstall.sh                # 卸载脚本
├── config/
│   ├── values.yaml            # Harbor Helm values 配置
│   ├── pvc.yaml               # 持久化存储配置
│   ├── cert-manager.yaml      # cert-manager 证书配置
│   ├── scanner-config.yaml    # Trivy 扫描策略配置
│   ├── gc-config.yaml         # 垃圾回收策略配置
│   └── rbac.yaml              # RBAC 权限配置
├── certs/
│   └── generate-certs.sh      # 自签名证书生成脚本
└── init/
    ├── harbor-init.json       # 初始化配置文件
    └── init-harbor.sh         # 初始化脚本
```

## 前置条件

### 必需组件
- Kubernetes 集群 v1.24+
- kubectl 已配置并连接到集群
- Helm v3.8+
- Ingress Controller (nginx-ingress 推荐)
- 默认 StorageClass 或指定存储类

### 推荐组件
- cert-manager（用于自动证书管理）
- 至少 8GB 可用内存
- 至少 80GB 持久化存储

## 快速部署

### 1. 一键部署

```bash
# 进入 harbor 目录
cd /Users/xia/program/Docker-K8s/harbor

# 赋予执行权限
chmod +x deploy.sh uninstall.sh certs/generate-certs.sh init/init-harbor.sh

# 执行部署
./deploy.sh
```

### 2. 自定义域名部署

```bash
# 设置自定义域名
export HARBOR_DOMAIN=harbor.example.com
./deploy.sh
```

## 分步部署

### 步骤 1: 创建命名空间

```bash
kubectl apply -f namespace.yaml
```

### 步骤 2: 配置持久化存储

```bash
# 根据集群存储类修改 pvc.yaml 中的 storageClassName
kubectl apply -f config/pvc.yaml
```

### 步骤 3: 生成 HTTPS 证书

```bash
# 使用自签名证书
cd certs
./generate-certs.sh harbor.local

# 应用证书到集群
kubectl apply -f harbor-tls-secret.yaml
cd ..

# 或使用 cert-manager（需先安装 cert-manager）
kubectl apply -f config/cert-manager.yaml
```

### 步骤 4: 部署 Harbor

```bash
# 添加 Harbor Helm 仓库
helm repo add harbor https://helm.goharbor.io
helm repo update

# 部署 Harbor
helm upgrade --install harbor harbor/harbor \
  -n harbor-system \
  -f config/values.yaml \
  --version v1.13.0 \
  --timeout 10m \
  --wait
```

### 步骤 5: 配置扫描和垃圾回收

```bash
kubectl apply -f config/scanner-config.yaml
kubectl apply -f config/gc-config.yaml
```

### 步骤 6: 初始化项目和用户

```bash
# 等待 Harbor 服务就绪
kubectl wait --for=condition=Ready pods -n harbor-system --all --timeout=600s

# 运行初始化脚本
cd init
./init-harbor.sh
```

## 访问配置

### 配置本地访问

1. **配置 /etc/hosts**
```bash
# 获取 Ingress IP
INGRESS_IP=$(kubectl get ingress -n harbor-system harbor-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# 添加到 /etc/hosts
echo "$INGRESS_IP harbor.local" | sudo tee -a /etc/hosts
echo "$INGRESS_IP notary.harbor.local" | sudo tee -a /etc/hosts
```

2. **配置 Docker 信任证书**
```bash
# 创建 Docker 证书目录
sudo mkdir -p /etc/docker/certs.d/harbor.local

# 复制 CA 证书
sudo cp certs/ca.crt /etc/docker/certs.d/harbor.local/

# 重启 Docker
sudo systemctl restart docker
```

3. **登录 Harbor**
```bash
docker login harbor.local
# 用户名: admin
# 密码: Harbor12345
```

## 功能配置

### 镜像扫描策略

Trivy 扫描器配置位于 [config/scanner-config.yaml](config/scanner-config.yaml)：

- **自动扫描**: 推送镜像时自动触发扫描
- **漏洞阻断**: 高危漏洞阻止镜像推送
- **定时扫描**: 每日凌晨 2 点扫描所有镜像
- **扫描类型**: 漏洞、密钥、配置错误

### 垃圾回收策略

垃圾回收配置位于 [config/gc-config.yaml](config/gc-config.yaml)：

- **执行时间**: 每日凌晨执行
- **删除未标记**: 自动删除未标记的镜像
- **保留策略**:
  - 按日期保留 30 天
  - 按数量保留最近 10 个版本
  - 保留特定标签（latest, v*, *-stable）

### 项目和用户

初始化配置位于 [init/harbor-init.json](init/harbor-init.json)：

**默认项目**:
- `production` - 生产环境（高危漏洞阻断）
- `staging` - 预发布环境（严重漏洞阻断）
- `development` - 开发环境（仅扫描不阻断）
- `library` - 公共镜像库

**默认用户**:
- `admin` - 系统管理员
- `devops` - DevOps 团队（项目管理员）
- `developer` - 开发人员（开发者权限）
- `viewer` - 只读用户

**机器人账户**:
- `robot-cicd` - CI/CD 流水线使用
- `robot-scanner` - 镜像扫描使用

## 运维操作

### 查看 Harbor 状态

```bash
# 查看 Pod 状态
kubectl get pods -n harbor-system -o wide

# 查看服务状态
kubectl get svc -n harbor-system

# 查看 Ingress
kubectl get ingress -n harbor-system

# 查看 PVC
kubectl get pvc -n harbor-system
```

### 查看 Harbor 日志

```bash
# 查看 Core 日志
kubectl logs -n harbor-system deploy/harbor-core -f

# 查看 Registry 日志
kubectl logs -n harbor-system deploy/harbor-registry -f

# 查看 JobService 日志
kubectl logs -n harbor-system deploy/harbor-jobservice -f
```

### 手动触发垃圾回收

```bash
# 通过 Harbor API 触发
curl -k -X POST \
  -u "admin:Harbor12345" \
  https://harbor.local/api/v2.0/system/gc/schedule \
  -H "Content-Type: application/json"
```

### 手动触发镜像扫描

```bash
# 扫描指定镜像
curl -k -X POST \
  -u "admin:Harbor12345" \
  https://harbor.local/api/v2.0/projects/{project}/repositories/{repository}/artifacts/{tag}/scan
```

### 更新 Harbor 配置

```bash
# 修改 values.yaml 后更新
helm upgrade harbor harbor/harbor \
  -n harbor-system \
  -f config/values.yaml
```

### 备份和恢复

```bash
# 备份 PVC 数据
kubectl exec -n harbor-system deploy/harbor-core -- \
  pg_dump -U postgres registry > harbor_backup.sql

# 恢复数据
kubectl exec -i -n harbor-system deploy/harbor-core -- \
  psql -U postgres registry < harbor_backup.sql
```

## 故障排查

### 常见问题

1. **PVC 一直处于 Pending 状态**
```bash
# 检查 StorageClass
kubectl get storageclass

# 检查 PVC 事件
kubectl describe pvc -n harbor-system
```

2. **证书错误**
```bash
# 检查证书 Secret
kubectl get secret harbor-tls -n harbor-system -o yaml

# 重新生成证书
cd certs && ./generate-certs.sh harbor.local
```

3. **无法登录 Harbor**
```bash
# 检查 Core 服务
kubectl logs -n harbor-system deploy/harbor-core

# 检查数据库
kubectl exec -it -n harbor-system deploy/harbor-database -- psql -U postgres -d registry
```

4. **镜像推送失败**
```bash
# 检查 Docker 证书配置
ls -la /etc/docker/certs.d/harbor.local/

# 检查 Registry 服务
kubectl logs -n harbor-system deploy/harbor-registry
```

### 重置管理员密码

```bash
# 进入 Harbor Core Pod
kubectl exec -it -n harbor-system deploy/harbor-core -- /bin/bash

# 重置密码
harbor-admin reset-admin-password --password NewPassword123
```

## 卸载

```bash
# 执行卸载脚本
./uninstall.sh

# 或手动卸载
helm uninstall harbor -n harbor-system
kubectl delete namespace harbor-system
```

## 安全建议

1. **修改默认密码**: 首次登录后立即修改 admin 密码
2. **启用内容信任**: 生产项目启用 Notary 签名验证
3. **配置漏洞扫描**: 设置高危漏洞阻断策略
4. **使用 RBAC**: 按最小权限原则分配用户权限
5. **定期备份**: 定期备份 Harbor 数据库和配置
6. **监控告警**: 集成 Prometheus 监控 Harbor 指标

## 参考文档

- [Harbor 官方文档](https://goharbor.io/docs/)
- [Harbor Helm Chart](https://github.com/goharbor/harbor-helm)
- [Trivy 文档](https://aquasecurity.github.io/trivy/)
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
