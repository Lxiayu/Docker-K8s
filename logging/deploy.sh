#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGGING_DIR="${SCRIPT_DIR}"

echo "========================================="
echo "部署 EFK 日志系统到 Kubernetes"
echo "========================================="
echo ""

echo "1. 创建 logging 命名空间..."
kubectl apply -f "${LOGGING_DIR}/namespace.yaml"
echo ""

echo "2. 创建存储类和持久卷声明..."
kubectl apply -f "${LOGGING_DIR}/storage.yaml"
echo ""

echo "3. 部署 Elasticsearch 集群..."
kubectl apply -f "${LOGGING_DIR}/elasticsearch.yaml"
echo ""

echo "4. 等待 Elasticsearch 就绪..."
echo "等待 Elasticsearch Pod 启动..."
kubectl wait --for=condition=ready pod -l app=elasticsearch -n logging --timeout=600s || true
echo ""

echo "检查 Elasticsearch 集群健康状态..."
until kubectl exec -n logging elasticsearch-0 -- curl -s -u elastic:changeme http://localhost:9200/_cluster/health?wait_for_status=yellow&timeout=30s > /dev/null 2>&1; do
  echo "等待 Elasticsearch 集群健康..."
  sleep 10
done
echo "Elasticsearch 集群已就绪!"
echo ""

echo "5. 配置 ILM 策略和索引模板..."
kubectl apply -f "${LOGGING_DIR}/ilm-setup.yaml"
echo ""

echo "等待 ILM 设置 Job 完成..."
kubectl wait --for=condition=complete job/elasticsearch-ilm-setup -n logging --timeout=300s || true
echo ""

echo "6. 部署 Fluent Bit 日志采集..."
kubectl apply -f "${LOGGING_DIR}/fluent-bit.yaml"
echo ""

echo "等待 Fluent Bit DaemonSet 就绪..."
kubectl rollout status daemonset/fluent-bit -n logging --timeout=300s
echo ""

echo "7. 部署 Kibana 可视化界面..."
kubectl apply -f "${LOGGING_DIR}/kibana.yaml"
echo ""

echo "等待 Kibana 就绪..."
kubectl rollout status deployment/kibana -n logging --timeout=300s
echo ""

echo "========================================="
echo "部署完成!"
echo "========================================="
echo ""

echo "获取部署状态:"
echo ""
echo "命名空间:"
kubectl get namespace logging
echo ""

echo "Elasticsearch Pods:"
kubectl get pods -n logging -l app=elasticsearch
echo ""

echo "Fluent Bit Pods:"
kubectl get pods -n logging -l app.kubernetes.io/name=fluent-bit
echo ""

echo "Kibana Pods:"
kubectl get pods -n logging -l app.kubernetes.io/name=kibana
echo ""

echo "Services:"
kubectl get svc -n logging
echo ""

echo "访问信息:"
echo "-------------------"
echo "Elasticsearch: http://elasticsearch-client.logging.svc.cluster.local:9200"
echo "Kibana: http://kibana.logging.svc.cluster.local:5601"
echo ""

echo "端口转发命令:"
echo "-------------------"
echo "Elasticsearch: kubectl port-forward -n logging svc/elasticsearch-client 9200:9200"
echo "Kibana: kubectl port-forward -n logging svc/kibana 5601:5601"
echo ""

echo "默认凭据:"
echo "-------------------"
echo "用户名: elastic"
echo "密码: changeme"
echo ""

echo "查看日志:"
echo "-------------------"
echo "Elasticsearch: kubectl logs -n logging -l app=elasticsearch"
echo "Fluent Bit: kubectl logs -n logging -l app.kubernetes.io/name=fluent-bit"
echo "Kibana: kubectl logs -n logging -l app.kubernetes.io/name=kibana"
echo ""
