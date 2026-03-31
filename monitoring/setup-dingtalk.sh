#!/bin/bash

echo "========================================="
echo "配置钉钉告警通知"
echo "========================================="

echo ""
echo "请输入钉钉 Webhook URL:"
read -r DINGTALK_WEBHOOK

echo ""
echo "请输入钉钉签名密钥 (可选，按回车跳过):"
read -r DINGTALK_SECRET

NAMESPACE="monitoring"

cat <<EOF | kubectl apply -n $NAMESPACE -f -
apiVersion: v1
kind: Secret
metadata:
  name: dingtalk-webhook
  labels:
    app.kubernetes.io/name: dingtalk-webhook
type: Opaque
stringData:
  webhook-url: "$DINGTALK_WEBHOOK"
  secret: "${DINGTALK_SECRET:-}"
EOF

echo ""
echo "✓ 钉钉配置已保存"
echo ""
echo "部署钉钉 Webhook 适配器..."
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dingtalk-webhook
  namespace: $NAMESPACE
  labels:
    app: dingtalk-webhook
spec:
  replicas: 1
  selector:
    matchLabels:
      app: dingtalk-webhook
  template:
    metadata:
      labels:
        app: dingtalk-webhook
    spec:
      containers:
      - name: webhook
        image: timonwong/prometheus-webhook-dingtalk:latest
        args:
          - --web.listen-address=:8060
          - --config.file=/config/config.yml
        ports:
        - containerPort: 8060
        volumeMounts:
        - name: config
          mountPath: /config
      volumes:
      - name: config
        configMap:
          name: dingtalk-webhook-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: dingtalk-webhook-config
  namespace: $NAMESPACE
data:
  config.yml: |
    targets:
      webhook1:
        url: $DINGTALK_WEBHOOK
        secret: ${DINGTALK_SECRET:-}
---
apiVersion: v1
kind: Service
metadata:
  name: dingtalk-webhook
  namespace: $NAMESPACE
spec:
  selector:
    app: dingtalk-webhook
  ports:
  - port: 8060
    targetPort: 8060
EOF

echo ""
echo "✓ 钉钉告警配置完成"
echo ""
