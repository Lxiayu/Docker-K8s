# Kubernetes 集群环境部署指南

## 概述

本项目提供了完整的 Kubernetes 集群部署配置，用于搭建云原生 CI/CD 平台的基础设施。

## 前置要求

### 必需工具
- **Docker**: 20.10+ (已安装: 29.2.1)
- **kubectl**: 1.28+ (已安装: 1.35.2)
- **Kind**: 0.20+ (将自动安装)

### 系统要求
- macOS 或 Linux
- 至少 8GB 可用内存
- 至少 20GB 可用磁盘空间

## 目录结构

```
kubernetes/
├── kind/
│   └── cluster-config.yaml          # Kind 集群配置
├── calico/
│   └── calico.yaml                  # Calico 网络插件配置
├── storage/
│   ├── storageclass.yaml            # 存储类配置
│   └── persistent-volumes.yaml      # 持久卷配置
├── ingress/
│   └── nginx-ingress.yaml           # Nginx Ingress Controller 配置
├── namespaces/
│   └── namespaces.yaml              # 命名空间和资源配额
└── scripts/
    ├── setup-cluster.sh             # 集群部署脚本
    ├── cleanup.sh                   # 清理脚本
    └── check-status.sh              # 状态检查脚本
```

## 集群配置详情

### Kind 集群配置
- **集群名称**: cicd-cluster
- **Kubernetes 版本**: v1.28.0
- **节点配置**:
  - 1 个 control-plane 节点
  - 2 个 worker 节点
- **网络配置**:
  - Pod CIDR: 192.168.0.0/16
  - Service CIDR: 10.96.0.0/12
- **端口映射**:
  - HTTP: 80 → 30000
  - HTTPS: 443 → 30001

### 网络插件 (Calico)
- **版本**: v3.26.1
- **特性**:
  - 支持 NetworkPolicy
  - BGP 路由
  - IP-in-IP 隧道
  - MTU: 1440

### 存储配置
- **存储类**:
  - `local-storage` (默认): 本地存储，WaitForFirstConsumer
  - `standard`: 标准存储，Immediate
  - `fast-storage`: SSD 存储
  - `slow-storage`: HDD 存储
- **持久卷**:
  - local-pv-1: 10Gi
  - local-pv-2: 20Gi
  - local-pv-3: 50Gi

### Ingress Controller
- **类型**: Nginx Ingress Controller
- **版本**: v1.8.1
- **特性**:
  - 支持 TLS
  - 支持 WebSocket
  - 支持 gRPC
  - ValidatingWebhook

### 命名空间
| 命名空间 | 用途 | CPU 限制 | 内存限制 |
|---------|------|---------|---------|
| cicd-system | CI/CD 系统组件 | 8核 | 16Gi |
| monitoring | 监控系统 | 4核 | 8Gi |
| logging | 日志系统 | 4核 | 8Gi |
| dev | 开发环境 | - | - |
| test | 测试环境 | - | - |
| prod | 生产环境 | - | - |
| harbor | 镜像仓库 | - | - |
| argocd | GitOps 工具 | - | - |

## 快速开始

### 1. 部署集群

```bash
# 进入项目目录
cd /Users/xia/program/Docker-K8s

# 运行部署脚本
./kubernetes/scripts/setup-cluster.sh
```

部署脚本将自动执行以下操作:
1. 检查并安装必要工具
2. 创建 Kind 集群
3. 安装 Calico 网络插件
4. 配置存储类和持久卷
5. 部署 Nginx Ingress Controller
6. 创建命名空间和资源配额
7. 验证集群状态

### 2. 验证集群

```bash
# 检查集群状态
./kubernetes/scripts/check-status.sh

# 或手动检查
kubectl cluster-info
kubectl get nodes
kubectl get pods -A
```

### 3. 配置 kubectl

集群创建后，kubectl 配置会自动更新。验证配置:

```bash
# 查看当前上下文
kubectl config current-context

# 应该显示: kind-cicd-cluster
```

### 4. 测试 Ingress

创建测试应用:

```bash
# 创建测试部署
kubectl create deployment nginx-test --image=nginx -n default

# 创建服务
kubectl expose deployment nginx-test --port=80 -n default

# 创建 Ingress
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-test
  namespace: default
spec:
  ingressClassName: nginx
  rules:
  - host: test.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx-test
            port:
              number: 80
EOF

# 测试访问
curl -H "Host: test.local" http://localhost
```

## 清理集群

```bash
# 删除集群
./kubernetes/scripts/cleanup.sh
```

## 故障排查

### 常见问题

#### 1. Kind 安装失败
```bash
# 手动安装 Kind (macOS)
brew install kind

# 或使用官方脚本
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-darwin-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

#### 2. Calico Pod 未就绪
```bash
# 检查 Calico 日志
kubectl logs -n kube-system -l k8s-app=calico-node

# 检查节点网络
kubectl get nodes -o wide
```

#### 3. Ingress Controller 未就绪
```bash
# 检查 Ingress Controller 日志
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# 检查服务
kubectl get svc -n ingress-nginx
```

#### 4. 持久卷无法绑定
```bash
# 检查 PV 状态
kubectl get pv

# 检查 PVC 状态
kubectl get pvc -A

# 检查节点标签
kubectl get nodes --show-labels
```

### 日志查看

```bash
# 查看集群事件
kubectl get events -A --sort-by='.lastTimestamp'

# 查看特定 Pod 日志
kubectl logs -n <namespace> <pod-name>

# 查看所有系统组件
kubectl get pods -n kube-system
```

## 高级配置

### 自定义集群配置

编辑 `kubernetes/kind/cluster-config.yaml` 可以:
- 添加更多 worker 节点
- 修改端口映射
- 调整资源配置
- 添加额外的挂载点

### 自定义网络配置

编辑 `kubernetes/calico/calico.yaml` 可以:
- 修改 Pod CIDR
- 调整 MTU
- 配置 BGP
- 启用网络策略

### 自定义存储配置

编辑 `kubernetes/storage/` 下的文件可以:
- 添加新的存储类
- 创建更多持久卷
- 调整存储大小

## 下一步

集群部署完成后，可以继续部署:

1. **Harbor 镜像仓库** - 在 `harbor` 命名空间
2. **Prometheus + Grafana** - 在 `monitoring` 命名空间
3. **ELK 日志系统** - 在 `logging` 命名空间
4. **CI/CD 工具** - 在 `cicd-system` 命名空间
5. **ArgoCD** - 在 `argocd` 命名空间

## 参考资源

- [Kind 官方文档](https://kind.sigs.k8s.io/)
- [Calico 官方文档](https://docs.projectcalico.org/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Kubernetes 官方文档](https://kubernetes.io/docs/)

## 支持

如有问题，请检查:
1. 集群状态: `./kubernetes/scripts/check-status.sh`
2. 组件日志: `kubectl logs -n <namespace> <pod-name>`
3. 事件日志: `kubectl get events -A --sort-by='.lastTimestamp'`
