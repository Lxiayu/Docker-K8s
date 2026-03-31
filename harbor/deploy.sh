#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARBOR_DIR="$(dirname "$SCRIPT_DIR")"
NAMESPACE="harbor-system"
HARBOR_DOMAIN="${HARBOR_DOMAIN:-harbor.local}"
HELM_RELEASE="harbor"

echo "=========================================="
echo "   Harbor 镜像仓库部署脚本"
echo "=========================================="
echo ""

check_prerequisites() {
    echo "=== 检查前置条件 ==="
    
    echo "检查 kubectl..."
    if ! command -v kubectl &> /dev/null; then
        echo "错误: kubectl 未安装"
        exit 1
    fi
    echo "✓ kubectl 已安装"
    
    echo "检查 helm..."
    if ! command -v helm &> /dev/null; then
        echo "错误: helm 未安装"
        exit 1
    fi
    echo "✓ helm 已安装"
    
    echo "检查 Kubernetes 集群连接..."
    if ! kubectl cluster-info &> /dev/null; then
        echo "错误: 无法连接到 Kubernetes 集群"
        exit 1
    fi
    echo "✓ Kubernetes 集群连接正常"
    
    echo ""
}

create_namespace() {
    echo "=== 创建命名空间 ==="
    
    kubectl apply -f "$HARBOR_DIR/namespace.yaml"
    
    echo "✓ 命名空间 $NAMESPACE 创建成功"
    echo ""
}

setup_storage() {
    echo "=== 配置持久化存储 ==="
    
    echo "创建 PersistentVolumeClaim..."
    kubectl apply -f "$HARBOR_DIR/config/pvc.yaml"
    
    echo "等待 PVC 就绪..."
    kubectl wait --for=condition=Bound pvc -n $NAMESPACE --all --timeout=300s || true
    
    echo "✓ 持久化存储配置完成"
    echo ""
}

setup_certificates() {
    echo "=== 配置 HTTPS 证书 ==="
    
    if kubectl get secret harbor-tls -n $NAMESPACE &> /dev/null; then
        echo "证书 Secret 已存在"
    else
        echo "生成自签名证书..."
        chmod +x "$HARBOR_DIR/certs/generate-certs.sh"
        cd "$HARBOR_DIR/certs"
        ./generate-certs.sh "$HARBOR_DOMAIN"
        
        echo "创建 TLS Secret..."
        kubectl apply -f "$HARBOR_DIR/certs/harbor-tls-secret.yaml"
        
        cd "$HARBOR_DIR"
    fi
    
    echo "✓ HTTPS 证书配置完成"
    echo ""
}

add_helm_repo() {
    echo "=== 添加 Harbor Helm 仓库 ==="
    
    helm repo add harbor https://helm.goharbor.io || true
    helm repo update
    
    echo "✓ Helm 仓库添加成功"
    echo ""
}

deploy_harbor() {
    echo "=== 部署 Harbor ==="
    
    local values_file="$HARBOR_DIR/config/values.yaml"
    
    echo "使用 values 文件: $values_file"
    
    helm upgrade --install $HELM_RELEASE harbor/harbor \
        -n $NAMESPACE \
        -f "$values_file" \
        --version v1.13.0 \
        --timeout 10m \
        --wait
    
    echo "✓ Harbor 部署成功"
    echo ""
}

configure_scanner() {
    echo "=== 配置镜像扫描策略 ==="
    
    kubectl apply -f "$HARBOR_DIR/config/scanner-config.yaml"
    
    echo "✓ 镜像扫描策略配置完成"
    echo ""
}

configure_gc() {
    echo "=== 配置垃圾回收策略 ==="
    
    kubectl apply -f "$HARBOR_DIR/config/gc-config.yaml"
    
    echo "✓ 垃圾回收策略配置完成"
    echo ""
}

wait_for_harbor() {
    echo "=== 等待 Harbor 服务就绪 ==="
    
    echo "等待所有 Pod 就绪..."
    kubectl wait --for=condition=Ready pods -n $NAMESPACE --all --timeout=600s
    
    echo "等待 Harbor API 就绪..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if kubectl exec -n $NAMESPACE deploy/harbor-core -- curl -s http://localhost:8080/api/v2.0/systeminfo > /dev/null 2>&1; then
            echo "✓ Harbor API 已就绪"
            break
        fi
        echo "等待 Harbor API... ($attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo ""
}

get_access_info() {
    echo "=== 访问信息 ==="
    
    local ingress_ip=$(kubectl get ingress -n $NAMESPACE harbor-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    local ingress_host=$(kubectl get ingress -n $NAMESPACE harbor-ingress -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "")
    
    echo ""
    echo "Harbor 访问地址:"
    if [ -n "$ingress_ip" ]; then
        echo "  https://$ingress_ip"
    fi
    if [ -n "$ingress_host" ]; then
        echo "  https://$ingress_host"
    fi
    
    echo ""
    echo "默认管理员账户:"
    echo "  用户名: admin"
    echo "  密码: Harbor12345"
    echo ""
    echo "请及时修改默认密码！"
    echo ""
    
    echo "配置 Docker 信任证书:"
    echo "  sudo mkdir -p /etc/docker/certs.d/$HARBOR_DOMAIN"
    echo "  sudo cp $HARBOR_DIR/certs/ca.crt /etc/docker/certs.d/$HARBOR_DOMAIN/"
    echo "  sudo systemctl restart docker"
    echo ""
    
    echo "配置 /etc/hosts (如需本地访问):"
    if [ -n "$ingress_ip" ]; then
        echo "  $ingress_ip $HARBOR_DOMAIN"
    else
        echo "  <INGRESS_IP> $HARBOR_DOMAIN"
    fi
    echo ""
}

initialize_harbor() {
    echo "=== 初始化 Harbor ==="
    
    chmod +x "$HARBOR_DIR/init/init-harbor.sh"
    
    echo "运行初始化脚本..."
    export HARBOR_URL="https://$HARBOR_DOMAIN"
    export HARBOR_USER="admin"
    export HARBOR_PASSWORD="Harbor12345"
    
    "$HARBOR_DIR/init/init-harbor.sh"
    
    echo "✓ Harbor 初始化完成"
    echo ""
}

show_status() {
    echo "=== Harbor 状态 ==="
    
    echo ""
    echo "Pod 状态:"
    kubectl get pods -n $NAMESPACE -o wide
    
    echo ""
    echo "服务状态:"
    kubectl get svc -n $NAMESPACE
    
    echo ""
    echo "Ingress 状态:"
    kubectl get ingress -n $NAMESPACE
    
    echo ""
    echo "PVC 状态:"
    kubectl get pvc -n $NAMESPACE
    
    echo ""
}

main() {
    check_prerequisites
    create_namespace
    setup_storage
    setup_certificates
    add_helm_repo
    deploy_harbor
    configure_scanner
    configure_gc
    wait_for_harbor
    get_access_info
    
    echo "=========================================="
    echo "   Harbor 部署完成！"
    echo "=========================================="
    echo ""
    
    show_status
    
    echo "下一步操作:"
    echo "1. 配置本地 hosts 文件或 DNS 解析"
    echo "2. 配置 Docker 信任证书"
    echo "3. 运行初始化脚本创建项目和用户"
    echo "   cd $HARBOR_DIR/init && ./init-harbor.sh"
    echo "4. 登录 Harbor: docker login $HARBOR_DOMAIN"
    echo ""
}

case "${1:-}" in
    --skip-init)
        main
        ;;
    --init-only)
        initialize_harbor
        ;;
    --status)
        show_status
        ;;
    --uninstall)
        echo "卸载 Harbor..."
        helm uninstall $HELM_RELEASE -n $NAMESPACE
        kubectl delete namespace $NAMESPACE --ignore-not-found=true
        echo "Harbor 已卸载"
        ;;
    *)
        main
        ;;
esac
