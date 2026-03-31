# CI/CD Platform - 故障排查指南

## 目录

1. [Kubernetes 集群问题](#kubernetes-集群问题)
2. [Harbor 镜像仓库问题](#harbor-镜像仓库问题)
3. [监控系统问题](#监控系统问题)
4. [日志系统问题](#日志系统问题)
5. [数据库问题](#数据库问题)
6. [应用服务问题](#应用服务问题)
7. [网络问题](#网络问题)
8. [存储问题](#存储问题)

## Kubernetes 集群问题

### 问题：节点状态 NotReady

**症状**:
```bash
kubectl get nodes
NAME                 STATUS     ROLES           AGE   VERSION
kind-control-plane   NotReady   control-plane   1h    v1.28.0
```

**排查步骤**:
```bash
# 1. 检查节点详情
kubectl describe node kind-control-plane

# 2. 检查 kubelet 状态
docker exec -it kind-control-plane systemctl status kubelet

# 3. 检查容器运行时
docker exec -it kind-control-plane crictl ps

# 4. 查看日志
docker exec -it kind-control-plane journalctl -u kubelet -f
```

**解决方案**:
- 重启 kubelet: `docker exec -it kind-control-plane systemctl restart kubelet`
- 检查网络插件是否正常运行
- 检查系统资源是否充足

### 问题：Pod 一直处于 Pending 状态

**症状**:
```bash
kubectl get pods
NAME                      READY   STATUS    RESTARTS   AGE
backend-xxx               0/1     Pending   0          5m
```

**排查步骤**:
```bash
# 1. 查看 Pod 详情
kubectl describe pod backend-xxx -n cicd-system

# 2. 检查节点资源
kubectl describe nodes

# 3. 检查 PVC 状态
kubectl get pvc -n cicd-system

# 4. 检查资源配额
kubectl get resourcequota -n cicd-system
```

**常见原因**:
- 节点资源不足（CPU/内存）
- PVC 未绑定
- 节点选择器不匹配
- 污点和容忍度问题

## Harbor 镜像仓库问题

### 问题：无法推送镜像

**症状**:
```bash
docker push harbor.local/production/frontend:v1.0.0
Error: denied: requested access to the resource is denied
```

**排查步骤**:
```bash
# 1. 检查登录状态
docker login harbor.local

# 2. 检查 Harbor 服务状态
kubectl get pods -n harbor-system

# 3. 检查项目权限
curl -u admin:Harbor12345 http://harbor.local/api/v2.0/projects

# 4. 查看 Harbor 日志
kubectl logs -n harbor-system -l component=core
```

**解决方案**:
```bash
# 重新登录
docker logout harbor.local
docker login harbor.local -u admin -p Harbor12345

# 检查项目是否存在
curl -X POST -u admin:Harbor12345 \
  http://harbor.local/api/v2.0/projects \
  -H "Content-Type: application/json" \
  -d '{"project_name":"production","public":false}'
```

### 问题：镜像拉取超时

**症状**:
```bash
Error: ImagePullBackOff
```

**排查步骤**:
```bash
# 1. 检查镜像是否存在
curl -u admin:Harbor12345 \
  http://harbor.local/api/v2.0/projects/production/repositories

# 2. 检查网络连接
kubectl run test --image=busybox --rm -it -- wget -O- http://harbor.local

# 3. 检查 DNS 解析
kubectl run test --image=busybox --rm -it -- nslookup harbor.local

# 4. 检查镜像拉取密钥
kubectl get secrets -n cicd-system
```

## 监控系统问题

### 问题：Prometheus 无法采集指标

**症状**:
- Grafana 看板无数据
- Prometheus targets 显示 down

**排查步骤**:
```bash
# 1. 检查 Prometheus 状态
kubectl get pods -n monitoring -l app.kubernetes.io/name=prometheus

# 2. 查看 Prometheus 日志
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus

# 3. 检查 ServiceMonitor
kubectl get servicemonitor -n monitoring

# 4. 检查 targets 状态
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# 访问 http://localhost:9090/targets
```

**解决方案**:
- 检查 ServiceMonitor 配置
- 确认 Service 标签匹配
- 检查网络策略
- 验证指标路径是否正确

### 问题：Grafana 看板无法显示

**症状**:
- Grafana 看板显示 "No data"

**排查步骤**:
```bash
# 1. 检查数据源配置
kubectl get configmap -n monitoring grafana-datasources -o yaml

# 2. 检查 Grafana 日志
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana

# 3. 测试数据源连接
kubectl port-forward -n monitoring svc/grafana 3000:80
# 登录 Grafana 检查数据源设置
```

## 日志系统问题

### 问题：Elasticsearch 无法启动

**症状**:
```bash
kubectl get pods -n logging
NAME                     READY   STATUS             RESTARTS   AGE
elasticsearch-0          0/1     CrashLoopBackOff   5          10m
```

**排查步骤**:
```bash
# 1. 查看 Pod 日志
kubectl logs -n logging elasticsearch-0

# 2. 检查资源限制
kubectl describe pod -n logging elasticsearch-0

# 3. 检查存储
kubectl get pvc -n logging

# 4. 检查配置
kubectl get configmap -n logging elasticsearch-config -o yaml
```

**常见错误**:
- 内存不足: 增加 ES 内存配置
- 存储不足: 扩展 PVC 大小
- 配置错误: 检查 elasticsearch.yml

### 问题：日志未采集

**症状**:
- Kibana 中无日志数据

**排查步骤**:
```bash
# 1. 检查 Fluent Bit 状态
kubectl get pods -n logging -l app=fluent-bit

# 2. 查看 Fluent Bit 日志
kubectl logs -n logging -l app=fluent-bit

# 3. 检查 Elasticsearch 索引
curl -X GET "http://elasticsearch:9200/_cat/indices?v"

# 4. 检查 Fluent Bit 配置
kubectl get configmap -n logging fluent-bit-config -o yaml
```

## 数据库问题

### 问题：PostgreSQL 连接失败

**症状**:
```
Error: connection refused
```

**排查步骤**:
```bash
# 1. 检查 PostgreSQL 状态
kubectl get pods -n database

# 2. 检查 Service
kubectl get svc -n database

# 3. 测试连接
kubectl run psql --image=postgres --rm -it -- \
  psql -h postgres.database.svc.cluster.local -U cicd -d cicd_platform

# 4. 查看日志
kubectl logs -n database -l app=postgres
```

**解决方案**:
- 检查密码是否正确
- 确认数据库已创建
- 检查网络策略
- 验证用户权限

## 应用服务问题

### 问题：后端 API 无法访问

**症状**:
```bash
curl http://api.cicd-platform.local/health
Connection refused
```

**排查步骤**:
```bash
# 1. 检查后端 Pod 状态
kubectl get pods -n cicd-system -l app=backend

# 2. 检查 Service
kubectl get svc -n cicd-system backend

# 3. 检查 Ingress
kubectl get ingress -n cicd-system

# 4. 查看后端日志
kubectl logs -n cicd-system -l app=backend

# 5. 测试内部连接
kubectl run test --image=busybox --rm -it -- \
  wget -O- http://backend.cicd-system.svc.cluster.local:8080/health
```

### 问题：前端页面无法加载

**症状**:
- 浏览器显示 404 或空白页面

**排查步骤**:
```bash
# 1. 检查前端 Pod
kubectl get pods -n cicd-system -l app=frontend

# 2. 检查前端 Service
kubectl get svc -n cicd-system frontend

# 3. 检查 Ingress
kubectl get ingress -n cicd-system

# 4. 查看 nginx 日志
kubectl logs -n cicd-system -l app=frontend
```

## 网络问题

### 问题：DNS 解析失败

**症状**:
```bash
nslookup harbor.local
Server:         10.96.0.10
Address:        10.96.0.10#53

** server can't find harbor.local: NXDOMAIN
```

**解决方案**:
```bash
# 1. 添加 hosts 记录
echo "127.0.0.1 harbor.local" | sudo tee -a /etc/hosts

# 2. 或配置 CoreDNS
kubectl edit configmap coredns -n kube-system
```

### 问题：跨命名空间访问失败

**排查步骤**:
```bash
# 1. 检查网络策略
kubectl get networkpolicy --all-namespaces

# 2. 测试连接
kubectl run test --image=busybox --rm -it -- \
  wget -O- http://backend.cicd-system.svc.cluster.local:8080/health

# 3. 检查 Service DNS
kubectl run test --image=busybox --rm -it -- \
  nslookup backend.cicd-system.svc.cluster.local
```

## 存储问题

### 问题：PVC 一直处于 Pending 状态

**症状**:
```bash
kubectl get pvc
NAME         STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
data-pvc     Pending                                       standard       5m
```

**排查步骤**:
```bash
# 1. 查看 PVC 详情
kubectl describe pvc data-pvc

# 2. 检查 StorageClass
kubectl get storageclass

# 3. 检查 PV
kubectl get pv

# 4. 检查 Provisioner 日志
kubectl logs -n kube-system -l app=csi-provisioner
```

**解决方案**:
- 确认 StorageClass 存在
- 检查 Provisioner 是否正常运行
- 验证存储后端配置

## 通用排查技巧

### 查看资源使用情况

```bash
# 节点资源
kubectl top nodes

# Pod 资源
kubectl top pods --all-namespaces

# 资源配额
kubectl describe resourcequota -n cicd-system
```

### 查看事件

```bash
# 所有事件
kubectl get events --all-namespaces --sort-by='.lastTimestamp'

# 特定命名空间
kubectl get events -n cicd-system --sort-by='.lastTimestamp'

# 特定资源
kubectl describe pod <pod-name> -n <namespace>
```

### 收集诊断信息

```bash
# 收集所有 Pod 状态
kubectl get pods --all-namespaces -o wide > pods-status.txt

# 收集所有 Service 状态
kubectl get svc --all-namespaces > svc-status.txt

# 收集日志
kubectl logs --all-namespaces -l app > all-logs.txt
```

## 获取帮助

如果以上方法无法解决问题：

1. 查看项目文档: `/docs`
2. 搜索 GitHub Issues
3. 提交新的 Issue，包含：
   - 问题描述
   - 排查步骤
   - 相关日志
   - 环境信息
