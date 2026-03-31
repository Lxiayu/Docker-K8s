# Kubernetes 监控系统部署指南

## 目录结构

```
monitoring/
├── namespace.yaml                          # 监控命名空间
├── prometheus-operator/
│   └── values.yaml                        # Helm values 配置
├── prometheus/
│   ├── servicemonitors/                   # ServiceMonitor 配置
│   │   ├── kube-apiserver-monitor.yaml
│   │   ├── kubelet-monitor.yaml
│   │   ├── kube-scheduler-monitor.yaml
│   │   ├── kube-controller-manager-monitor.yaml
│   │   └── coredns-monitor.yaml
│   ├── podmonitors/                       # PodMonitor 配置
│   │   ├── nginx-ingress-monitor.yaml
│   │   ├── redis-monitor.yaml
│   │   ├── mysql-monitor.yaml
│   │   └── application-monitor.yaml
│   └── rules/                             # 告警规则
│       ├── kubernetes-node-alerts.yaml
│       ├── kubernetes-pod-alerts.yaml
│       ├── kubernetes-resource-alerts.yaml
│       ├── kubernetes-service-alerts.yaml
│       ├── custom-application-alerts.yaml
│       └── custom-business-metrics.yaml
├── alertmanager/
│   ├── alertmanager-config.yaml           # 邮件通知配置
│   ├── alertmanager-dingtalk.yaml         # 钉钉通知配置
│   ├── alertmanager-wechat.yaml           # 企业微信通知配置
│   └── templates.yaml                     # 告警模板
├── grafana/
│   ├── dashboards/
│   │   └── kubernetes-cluster-overview.yaml
│   └── datasources.yaml
├── deploy.sh                              # 部署脚本
├── uninstall.sh                           # 卸载脚本
├── verify.sh                              # 验证脚本
├── setup-dingtalk.sh                      # 钉钉配置脚本
├── setup-wechat.sh                        # 企业微信配置脚本
└── import-dashboards.sh                   # 看板导入脚本
```

## 快速开始

### 1. 部署监控系统

```bash
cd monitoring
chmod +x *.sh
./deploy.sh
```

### 2. 验证部署

```bash
./verify.sh
```

### 3. 访问监控界面

#### Prometheus UI
```bash
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
```
访问: http://localhost:9090

#### Grafana UI
```bash
kubectl port-forward -n monitoring svc/prometheus-operator-grafana 3000:80
```
访问: http://localhost:3000
- 用户名: admin
- 密码: admin123

#### AlertManager UI
```bash
kubectl port-forward -n monitoring svc/alertmanager-operated 9093:9093
```
访问: http://localhost:9093

## 配置说明

### Prometheus 配置

#### 数据采集配置
- **ServiceMonitor**: 用于监控 Kubernetes Service
  - kube-apiserver: API Server 监控
  - kubelet: 节点和容器监控
  - kube-scheduler: 调度器监控
  - kube-controller-manager: 控制器管理器监控
  - coredns: DNS 服务监控

- **PodMonitor**: 用于监控特定 Pod
  - nginx-ingress: Ingress Controller 监控
  - redis: Redis 监控
  - mysql: MySQL 监控
  - application: 应用 Pod 监控

#### 告警规则
- **节点告警**: 节点状态、CPU、内存、磁盘监控
- **Pod 告警**: Pod 重启、状态、资源使用监控
- **资源告警**: PV 使用、资源配额、HPA 状态监控
- **服务告警**: 端点可用性、Ingress 错误率监控
- **应用告警**: 错误率、延迟、吞吐量监控
- **业务指标**: 订单处理、支付、用户注册监控

### AlertManager 配置

#### 邮件通知
编辑 `alertmanager/alertmanager-config.yaml`:
```yaml
global:
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alertmanager@example.com'
  smtp_auth_username: 'alertmanager@example.com'
  smtp_auth_password: 'your-email-password'
```

#### 钉钉通知
```bash
./setup-dingtalk.sh
```

#### 企业微信通知
```bash
./setup-wechat.sh
```

### Grafana 配置

#### 导入社区看板
```bash
./import-dashboards.sh
```

推荐看板:
- **315**: Kubernetes Cluster Monitoring
- **1860**: Node Exporter Full
- **6417**: Kubernetes Pods

#### 自定义看板
编辑 `grafana/dashboards/kubernetes-cluster-overview.yaml`

## 监控指标

### 核心指标

#### 集群级别
- 节点 CPU/内存使用率
- 节点状态和可用性
- 集群 Pod 总数
- 资源配额使用情况

#### Pod 级别
- Pod 状态和重启次数
- 容器 CPU/内存使用
- 网络流量
- 磁盘 I/O

#### 应用级别
- HTTP 请求速率
- 响应时间 (P95, P99)
- 错误率
- 业务指标

## 告警策略

### 告警级别
- **Critical**: 严重告警，需要立即处理
- **Warning**: 警告告警，需要关注

### 告警路由
1. Critical 告警 → 邮件 + 钉钉/企业微信
2. Warning 告警 → 邮件

### 告警抑制
- Critical 告警会抑制同类型的 Warning 告警
- 避免告警风暴

## 运维操作

### 扩容 Prometheus
```bash
kubectl edit prometheus -n monitoring
# 修改 replicas 和 storage
```

### 更新告警规则
```bash
kubectl apply -f prometheus/rules/
```

### 重启服务
```bash
# 重启 Prometheus
kubectl rollout restart statefulset/prometheus-prometheus-operator-prometheus -n monitoring

# 重启 AlertManager
kubectl rollout restart statefulset/alertmanager-prometheus-operator-alertmanager -n monitoring

# 重启 Grafana
kubectl rollout restart deployment/prometheus-operator-grafana -n monitoring
```

### 备份配置
```bash
# 备份 Prometheus 配置
kubectl get prometheus -n monitoring -o yaml > prometheus-backup.yaml

# 备份告警规则
kubectl get prometheusrule -n monitoring -o yaml > rules-backup.yaml
```

### 查看日志
```bash
# Prometheus 日志
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus

# AlertManager 日志
kubectl logs -n monitoring -l app.kubernetes.io/name=alertmanager

# Grafana 日志
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana
```

## 故障排查

### Prometheus 无法采集数据
1. 检查 ServiceMonitor 标签是否匹配
2. 检查 Service 是否存在
3. 检查网络策略是否允许访问

### 告警未触发
1. 检查告警规则是否正确
2. 检查 PrometheusRule 是否被选中
3. 检查 AlertManager 配置

### Grafana 无法连接数据源
1. 检查 Prometheus Service 是否正常
2. 检查网络连接
3. 检查数据源配置

## 最佳实践

1. **资源限制**: 为所有组件设置合理的资源请求和限制
2. **持久化存储**: 启用持久化存储保存历史数据
3. **高可用**: 部署多个副本保证服务可用性
4. **告警分级**: 合理设置告警级别和阈值
5. **定期备份**: 定期备份配置和规则
6. **监控监控**: 监控监控系统本身的健康状态

## 卸载

```bash
./uninstall.sh
```

## 参考文档

- [Prometheus Operator](https://github.com/prometheus-operator/prometheus-operator)
- [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)
- [Prometheus 文档](https://prometheus.io/docs/)
- [Grafana 文档](https://grafana.com/docs/)
- [AlertManager 文档](https://prometheus.io/docs/alerting/latest/alertmanager/)
