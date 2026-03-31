#!/bin/bash

echo "========================================="
echo "验证监控系统部署状态"
echo "========================================="

NAMESPACE="monitoring"

echo ""
echo "检查命名空间..."
kubectl get namespace $NAMESPACE

echo ""
echo "检查 Pod 状态..."
kubectl get pods -n $NAMESPACE

echo ""
echo "检查 Service 状态..."
kubectl get svc -n $NAMESPACE

echo ""
echo "检查 Prometheus 状态..."
kubectl get prometheus -n $NAMESPACE

echo ""
echo "检查 AlertManager 状态..."
kubectl get alertmanager -n $NAMESPACE

echo ""
echo "检查 ServiceMonitor..."
kubectl get servicemonitor -n $NAMESPACE

echo ""
echo "检查 PodMonitor..."
kubectl get podmonitor -n $NAMESPACE

echo ""
echo "检查 PrometheusRule..."
kubectl get prometheusrule -n $NAMESPACE

echo ""
echo "检查持久卷声明..."
kubectl get pvc -n $NAMESPACE

echo ""
echo "========================================="
echo "验证完成！"
echo "========================================="
