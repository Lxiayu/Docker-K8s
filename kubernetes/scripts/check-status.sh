#!/bin/bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

check_cluster() {
    log_info "检查集群状态..."
    echo ""
    
    echo "=== 节点状态 ==="
    kubectl get nodes -o wide
    echo ""
    
    echo "=== 系统组件状态 ==="
    kubectl get pods -n kube-system
    echo ""
    
    echo "=== Calico 网络插件状态 ==="
    kubectl get pods -n kube-system | grep calico
    echo ""
    
    echo "=== Ingress Controller 状态 ==="
    kubectl get pods -n ingress-nginx
    echo ""
    kubectl get svc -n ingress-nginx
    echo ""
    
    echo "=== 存储类 ==="
    kubectl get storageclass
    echo ""
    
    echo "=== 持久卷 ==="
    kubectl get pv
    echo ""
    
    echo "=== 命名空间 ==="
    kubectl get namespaces
    echo ""
    
    echo "=== 资源配额 ==="
    kubectl get resourcequota -A
    echo ""
    
    log_success "状态检查完成"
}

check_cluster
