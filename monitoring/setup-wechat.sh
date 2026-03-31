#!/bin/bash

echo "========================================="
echo "配置企业微信告警通知"
echo "========================================="

echo ""
echo "请输入企业微信 Corp ID:"
read -r CORP_ID

echo ""
echo "请输入企业微信 Agent ID:"
read -r AGENT_ID

echo ""
echo "请输入企业微信 API Secret:"
read -r API_SECRET

NAMESPACE="monitoring"

kubectl create secret generic alertmanager-wechat-secret \
    --from-literal=corp-id=$CORP_ID \
    --from-literal=agent-id=$AGENT_ID \
    --from-literal=api-secret=$API_SECRET \
    --namespace=$NAMESPACE \
    --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "✓ 企业微信配置已保存"
echo ""
echo "请手动更新 AlertManager 配置文件:"
echo "  monitoring/alertmanager/alertmanager-wechat.yaml"
echo ""
