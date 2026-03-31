#!/bin/bash

set -e

NAMESPACE="harbor-system"
HARBOR_DOMAIN="${HARBOR_DOMAIN:-harbor.local}"

echo "=== Harbor 卸载脚本 ==="

echo "警告: 此操作将删除 Harbor 及其所有数据！"
read -p "确认卸载? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "取消卸载"
    exit 0
fi

echo "1. 卸载 Helm Release..."
helm uninstall harbor -n $NAMESPACE 2>/dev/null || true

echo "2. 删除 PVC..."
kubectl delete pvc -n $NAMESPACE --all 2>/dev/null || true

echo "3. 删除命名空间..."
kubectl delete namespace $NAMESPACE --ignore-not-found=true

echo "4. 清理本地证书..."
rm -rf /Users/xia/program/Docker-K8s/harbor/certs/*.crt
rm -rf /Users/xia/program/Docker-K8s/harbor/certs/*.key
rm -rf /Users/xia/program/Docker-K8s/harbor/certs/*.csr
rm -rf /Users/xia/program/Docker-K8s/harbor/certs/*.srl
rm -rf /Users/xia/program/Docker-K8s/harbor/certs/*.cnf
rm -rf /Users/xia/program/Docker-K8s/harbor/certs/*.yaml

echo ""
echo "=== 卸载完成 ==="
echo ""
echo "如需重新部署，请运行:"
echo "  ./deploy.sh"
