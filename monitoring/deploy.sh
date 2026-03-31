#!/bin/bash

set -e

echo "========================================="
echo "Kubernetes 监控系统部署脚本"
echo "========================================="

NAMESPACE="monitoring"
RELEASE_NAME="prometheus-operator"
CHART_REPO="prometheus-community"
CHART_NAME="kube-prometheus-stack"

echo ""
echo "[1/8] 检查 kubectl 连接..."
if ! kubectl cluster-info &> /dev/null; then
    echo "错误: 无法连接到 Kubernetes 集群"
    exit 1
fi
echo "✓ Kubernetes 集群连接正常"

echo ""
echo "[2/8] 创建监控命名空间..."
kubectl apply -f namespace.yaml
echo "✓ 命名空间创建完成"

echo ""
echo "[3/8] 添加 Helm 仓库..."
if ! helm repo list | grep -q "$CHART_REPO"; then
    helm repo add $CHART_REPO https://prometheus-community.github.io/helm-charts
fi
helm repo update
echo "✓ Helm 仓库更新完成"

echo ""
echo "[4/8] 部署 Prometheus Operator..."
helm upgrade --install $RELEASE_NAME $CHART_REPO/$CHART_NAME \
    --namespace $NAMESPACE \
    --values prometheus-operator/values.yaml \
    --timeout 10m \
    --wait
echo "✓ Prometheus Operator 部署完成"

echo ""
echo "[5/8] 部署 ServiceMonitor 配置..."
kubectl apply -f prometheus/servicemonitors/
echo "✓ ServiceMonitor 配置完成"

echo ""
echo "[6/8] 部署 PodMonitor 配置..."
kubectl apply -f prometheus/podmonitors/
echo "✓ PodMonitor 配置完成"

echo ""
echo "[7/8] 部署告警规则..."
kubectl apply -f prometheus/rules/
echo "✓ 告警规则配置完成"

echo ""
echo "[8/8] 部署 AlertManager 配置..."
kubectl apply -f alertmanager/
echo "✓ AlertManager 配置完成"

echo ""
echo "========================================="
echo "监控系统部署完成！"
echo "========================================="
echo ""
echo "访问方式："
echo ""
echo "Prometheus UI:"
echo "  kubectl port-forward -n $NAMESPACE svc/prometheus-operated 9090:9090"
echo "  访问: http://localhost:9090"
echo ""
echo "Grafana UI:"
echo "  kubectl port-forward -n $NAMESPACE svc/prometheus-operator-grafana 3000:80"
echo "  访问: http://localhost:3000"
echo "  默认用户名: admin"
echo "  默认密码: admin123"
echo ""
echo "AlertManager UI:"
echo "  kubectl port-forward -n $NAMESPACE svc/alertmanager-operated 9093:9093"
echo "  访问: http://localhost:9093"
echo ""
echo "查看部署状态:"
echo "  kubectl get all -n $NAMESPACE"
echo ""
