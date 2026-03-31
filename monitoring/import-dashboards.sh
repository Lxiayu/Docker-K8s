#!/bin/bash

echo "========================================="
echo "导入 Grafana 监控看板"
echo "========================================="

NAMESPACE="monitoring"

echo ""
echo "可用的看板模板:"
echo "1. Kubernetes Cluster Monitoring (ID: 315)"
echo "2. Node Exporter Full (ID: 1860)"
echo "3. Kubernetes Pods (ID: 6417)"
echo "4. Custom Application Dashboard"
echo ""
echo "请选择要导入的看板 (输入数字，多个用空格分隔):"
read -r DASHBOARD_IDS

for id in $DASHBOARD_IDS; do
    case $id in
        1)
            DASHBOARD_ID=315
            DASHBOARD_NAME="kubernetes-cluster"
            ;;
        2)
            DASHBOARD_ID=1860
            DASHBOARD_NAME="node-exporter"
            ;;
        3)
            DASHBOARD_ID=6417
            DASHBOARD_NAME="kubernetes-pods"
            ;;
        4)
            echo "自定义看板已包含在部署中"
            continue
            ;;
        *)
            echo "无效的选择: $id"
            continue
            ;;
    esac
    
    echo ""
    echo "导入看板 $DASHBOARD_NAME (ID: $DASHBOARD_ID)..."
    
    curl -s "https://grafana.com/api/dashboards/$DASHBOARD_ID/revisions/latest/download" \
        -o /tmp/dashboard-$DASHBOARD_ID.json
    
    kubectl create configmap grafana-dashboard-$DASHBOARD_NAME \
        --from-file=$DASHBOARD_NAME.json=/tmp/dashboard-$DASHBOARD_ID.json \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    echo "✓ 看板 $DASHBOARD_NAME 导入完成"
done

echo ""
echo "========================================="
echo "看板导入完成！"
echo "========================================="
echo ""
echo "访问 Grafana 查看看板:"
echo "  kubectl port-forward -n $NAMESPACE svc/prometheus-operator-grafana 3000:80"
echo "  http://localhost:3000"
echo ""
