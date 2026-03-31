# Kubernetes EFK 日志系统

完整的 EFK (Elasticsearch + Fluent Bit + Kibana) 日志系统部署配置。

## 架构组件

### 1. Elasticsearch
- **部署方式**: StatefulSet (3副本)
- **存储**: 每个节点 50GB 持久化存储
- **资源**: 每个节点 2核CPU, 8GB内存
- **功能**: 日志存储和索引

### 2. Fluent Bit
- **部署方式**: DaemonSet (每个节点一个Pod)
- **资源**: 500m CPU, 512MB 内存
- **功能**: 日志采集和转发
- **采集源**: 
  - 容器日志 (/var/log/containers/*.log)
  - 系统日志 (systemd journal)

### 3. Kibana
- **部署方式**: Deployment (1副本)
- **资源**: 1核CPU, 2GB内存
- **功能**: 日志可视化和查询界面

## 快速开始

### 前置要求
- Kubernetes 集群 (v1.20+)
- kubectl 已配置
- 至少 3个节点用于 Elasticsearch
- 持久化存储支持 (PV)

### 部署步骤

```bash
# 1. 赋予脚本执行权限
chmod +x deploy.sh undeploy.sh

# 2. 执行部署
./deploy.sh

# 3. 验证部署状态
kubectl get all -n logging
```

### 访问服务

#### 方法1: 端口转发
```bash
# Elasticsearch
kubectl port-forward -n logging svc/elasticsearch-client 9200:9200

# Kibana
kubectl port-forward -n logging svc/kibana 5601:5601
```

#### 方法2: Ingress
配置 hosts 文件:
```
<INGRESS_IP> kibana.local
```
访问: http://kibana.local

### 默认凭据
- **用户名**: elastic
- **密码**: changeme

⚠️ **生产环境请务必修改默认密码!**

## 配置说明

### Elasticsearch 配置
文件: [elasticsearch.yaml](elasticsearch.yaml)
- 集群名称: k8s-logs
- 副本数: 3
- JVM堆内存: 2GB
- 启用安全认证

### Fluent Bit 配置
文件: [fluent-bit.yaml](fluent-bit.yaml)
- 日志采集路径: /var/log/containers/*.log
- 解析器: CRI, Docker, JSON
- 输出: Elasticsearch
- 缓冲: 文件系统缓冲 (50MB)

### Kibana 配置
文件: [kibana.yaml](kibana.yaml)
- 语言: 中文
- 基础路径: /kibana
- 连接: Elasticsearch

## 日志保留策略 (ILM)

### 策略配置
文件: [ilm-setup.yaml](ilm-setup.yaml)

| 阶段 | 时间 | 动作 |
|------|------|------|
| Hot | 0ms | 滚动更新 (50GB/1天/1亿文档) |
| Warm | 7天 | 强制合并、压缩、减少副本 |
| Cold | 30天 | 冻结索引、移除副本 |
| Delete | 90天 | 删除索引 |

### 索引模板
- **索引模式**: k8s-logs-*
- **分片数**: 3
- **副本数**: 1
- **刷新间隔**: 5秒

## 日志字段

采集的日志包含以下字段:

| 字段 | 类型 | 说明 |
|------|------|------|
| @timestamp | date | 时间戳 |
| log | text | 原始日志内容 |
| message | text | 日志消息 |
| pod_name | keyword | Pod名称 |
| namespace | keyword | 命名空间 |
| container_name | keyword | 容器名称 |
| container_image | keyword | 容器镜像 |
| host | keyword | 主机名 |
| cluster_name | keyword | 集群名称 |
| environment | keyword | 环境标识 |

## 常用操作

### 查看 Elasticsearch 集群状态
```bash
kubectl exec -n logging elasticsearch-0 -- curl -u elastic:changeme http://localhost:9200/_cluster/health?pretty
```

### 查看索引列表
```bash
kubectl exec -n logging elasticsearch-0 -- curl -u elastic:changeme http://localhost:9200/_cat/indices?v
```

### 查看 ILM 策略
```bash
kubectl exec -n logging elasticsearch-0 -- curl -u elastic:changeme http://localhost:9200/_ilm/policy/k8s-logs-policy?pretty
```

### 手动触发索引滚动
```bash
kubectl exec -n logging elasticsearch-0 -- curl -X POST -u elastic:changeme http://localhost:9200/k8s-logs/_rollover
```

### 查看 Fluent Bit 日志
```bash
kubectl logs -n logging -l app.kubernetes.io/name=fluent-bit
```

### 查看 Kibana 日志
```bash
kubectl logs -n logging -l app.kubernetes.io/name=kibana
```

## 性能调优

### Elasticsearch
1. 调整 JVM 堆内存 (ES_JAVA_OPTS)
2. 调整分片数量和副本数
3. 配置索引刷新间隔
4. 启用索引压缩

### Fluent Bit
1. 调整 Mem_Buf_Limit (内存缓冲限制)
2. 调整 Refresh_Interval (刷新间隔)
3. 配置存储缓冲 (storage.path)
4. 启用压缩 (Compress gzip)

### Kibana
1. 调整内存限制
2. 配置并发查询限制
3. 优化仪表板设计

## 监控指标

### Prometheus 指标
Fluent Bit 暴露 Prometheus 指标:
- 端口: 2020
- 路径: /api/v1/metrics/prometheus

### 关键指标
- 输入记录数
- 输出记录数
- 错误数
- 重试次数
- 缓冲使用量

## 故障排查

### Elasticsearch 无法启动
1. 检查 vm.max_map_count 设置
2. 检查存储是否可用
3. 检查内存是否足够
4. 查看日志: `kubectl logs -n logging elasticsearch-0`

### Fluent Bit 无法连接 Elasticsearch
1. 检查 Elasticsearch 服务是否正常
2. 检查网络策略
3. 验证凭据是否正确
4. 查看 Fluent Bit 日志

### Kibana 无法访问
1. 检查 Kibana Pod 状态
2. 检查 Elasticsearch 连接
3. 查看浏览器控制台错误
4. 查看 Kibana 日志

### 日志丢失
1. 检查 Fluent Bit 缓冲配置
2. 检查磁盘空间
3. 检查 Elasticsearch 索引状态
4. 验证日志采集路径

## 安全加固

### 生产环境建议
1. 修改默认密码
2. 启用 TLS 加密
3. 配置 RBAC 权限
4. 启用审计日志
5. 配置网络策略
6. 定期备份索引

### 密码修改
```bash
# 修改 Secret
kubectl edit secret elasticsearch-credentials -n logging

# 重启相关组件
kubectl rollout restart statefulset/elasticsearch -n logging
kubectl rollout restart deployment/kibana -n logging
kubectl rollout restart daemonset/fluent-bit -n logging
```

## 备份与恢复

### 备份索引
```bash
# 创建快照仓库
kubectl exec -n logging elasticsearch-0 -- curl -X PUT -u elastic:changeme http://localhost:9200/_snapshot/backup -H 'Content-Type: application/json' -d '{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/backup"
  }
}'

# 创建快照
kubectl exec -n logging elasticsearch-0 -- curl -X PUT -u elastic:changeme http://localhost:9200/_snapshot/backup/snapshot_1
```

### 恢复索引
```bash
kubectl exec -n logging elasticsearch-0 -- curl -X POST -u elastic:changeme http://localhost:9200/_snapshot/backup/snapshot_1/_restore
```

## 卸载

```bash
# 执行卸载脚本
./undeploy.sh

# 手动删除 PVC (可选)
kubectl delete pvc -n logging -l app=elasticsearch
```

## 文件清单

```
logging/
├── namespace.yaml          # 命名空间配置
├── storage.yaml           # 存储类和 PVC 配置
├── elasticsearch.yaml     # Elasticsearch StatefulSet
├── fluent-bit.yaml        # Fluent Bit DaemonSet
├── kibana.yaml           # Kibana Deployment
├── ilm-setup.yaml        # ILM 策略配置 Job
├── deploy.sh             # 部署脚本
├── undeploy.sh           # 卸载脚本
└── README.md             # 说明文档
```

## 参考资源

- [Elasticsearch 官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Fluent Bit 官方文档](https://docs.fluentbit.io/manual/)
- [Kibana 官方文档](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Kubernetes 日志架构](https://kubernetes.io/docs/concepts/cluster-administration/logging/)
