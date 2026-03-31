#!/bin/bash

set -e

echo "========================================="
echo "卸载 Kubernetes 监控系统"
echo "========================================="

NAMESPACE="monitoring"
RELEASE_NAME="prometheus-operator"

echo ""
echo "[1/3] 删除 Helm Release..."
helm uninstall $RELEASE_NAME --namespace $NAMESPACE 2>/dev/null || true
echo "✓ Helm Release 已删除"

echo ""
echo "[2/3] 删除自定义资源..."
kubectl delete -f prometheus/rules/ --ignore-not-found=true
kubectl delete -f prometheus/servicemonitors/ --ignore-not-found=true
kubectl delete -f prometheus/podmonitors/ --ignore-not-found=true
kubectl delete -f alertmanager/ --ignore-not-found=true
kubectl delete -f grafana/ --ignore-not-found=true
echo "✓ 自定义资源已删除"

echo ""
echo "[3/3] 删除命名空间..."
kubectl delete namespace $NAMESPACE --ignore-not-found=true
echo "✓ 命名空间已删除"

echo ""
echo "========================================="
echo "监控系统卸载完成！"
echo "========================================="
