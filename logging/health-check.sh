#!/bin/bash

echo "========================================="
echo "EFK 日志系统健康检查"
echo "========================================="
echo ""

echo "1. 检查命名空间..."
kubectl get namespace logging 2>/dev/null || echo "❌ 命名空间不存在"
echo ""

echo "2. 检查 Elasticsearch..."
echo "Pods:"
kubectl get pods -n logging -l app=elasticsearch 2>/dev/null || echo "❌ Elasticsearch Pods 不存在"
echo ""
echo "Services:"
kubectl get svc -n logging -l app=elasticsearch 2>/dev/null || echo "❌ Elasticsearch Services 不存在"
echo ""

echo "3. 检查 Fluent Bit..."
echo "DaemonSet:"
kubectl get daemonset -n logging fluent-bit 2>/dev/null || echo "❌ Fluent Bit DaemonSet 不存在"
echo ""
echo "Pods:"
kubectl get pods -n logging -l app.kubernetes.io/name=fluent-bit 2>/dev/null || echo "❌ Fluent Bit Pods 不存在"
echo ""

echo "4. 检查 Kibana..."
echo "Deployment:"
kubectl get deployment -n logging kibana 2>/dev/null || echo "❌ Kibana Deployment 不存在"
echo ""
echo "Pods:"
kubectl get pods -n logging -l app.kubernetes.io/name=kibana 2>/dev/null || echo "❌ Kibana Pods 不存在"
echo ""

echo "5. 检查持久卷..."
kubectl get pvc -n logging 2>/dev/null || echo "❌ PVC 不存在"
echo ""

echo "6. 检查 Elasticsearch 集群健康状态..."
kubectl exec -n logging elasticsearch-0 -- curl -s -u elastic:changeme http://localhost:9200/_cluster/health?pretty 2>/dev/null || echo "❌ 无法连接 Elasticsearch"
echo ""

echo "7. 检查索引..."
kubectl exec -n logging elasticsearch-0 -- curl -s -u elastic:changeme http://localhost:9200/_cat/indices?v 2>/dev/null || echo "❌ 无法获取索引列表"
echo ""

echo "8. 检查 ILM 策略..."
kubectl exec -n logging elasticsearch-0 -- curl -s -u elastic:changeme http://localhost:9200/_ilm/policy/k8s-logs-policy?pretty 2>/dev/null || echo "❌ ILM 策略不存在"
echo ""

echo "========================================="
echo "健康检查完成"
echo "========================================="
