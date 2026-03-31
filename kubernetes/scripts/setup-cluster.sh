#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "检查必要的工具..."
    
    local missing_tools=()
    
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi
    
    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    fi
    
    if ! command -v kind &> /dev/null; then
        log_warning "Kind 未安装，正在安装..."
        install_kind
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "缺少以下工具: ${missing_tools[*]}"
        log_info "请先安装这些工具后再运行此脚本"
        exit 1
    fi
    
    log_success "所有必要工具已安装"
}

install_kind() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log_info "在 macOS 上安装 Kind..."
        curl -Lo ./kind "https://kind.sigs.k8s.io/dl/v0.20.0/kind-darwin-amd64"
        chmod +x ./kind
        sudo mv ./kind /usr/local/bin/kind
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_info "在 Linux 上安装 Kind..."
        curl -Lo ./kind "https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64"
        chmod +x ./kind
        sudo mv ./kind /usr/local/bin/kind
    else
        log_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
    
    log_success "Kind 安装完成"
}

create_cluster() {
    log_info "创建 Kubernetes 集群..."
    
    if kind get clusters | grep -q "cicd-cluster"; then
        log_warning "集群 cicd-cluster 已存在"
        read -p "是否删除并重新创建? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "删除现有集群..."
            kind delete cluster --name cicd-cluster
        else
            log_info "使用现有集群"
            return 0
        fi
    fi
    
    mkdir -p "$PROJECT_ROOT/data"
    mkdir -p "$PROJECT_ROOT/data/pv-1"
    mkdir -p "$PROJECT_ROOT/data/pv-2"
    mkdir -p "$PROJECT_ROOT/data/pv-3"
    
    log_info "使用 Kind 创建集群..."
    kind create cluster --config "$SCRIPT_DIR/../kind/cluster-config.yaml"
    
    log_success "集群创建完成"
}

install_calico() {
    log_info "安装 Calico 网络插件..."
    
    kubectl apply -f "$SCRIPT_DIR/../calico/calico.yaml"
    
    log_info "等待 Calico 组件就绪..."
    kubectl wait --for=condition=ready pod -l k8s-app=calico-node -n kube-system --timeout=300s
    kubectl wait --for=condition=ready pod -l k8s-app=calico-kube-controllers -n kube-system --timeout=300s
    
    log_success "Calico 安装完成"
}

install_storage() {
    log_info "配置存储类..."
    
    kubectl apply -f "$SCRIPT_DIR/../storage/storageclass.yaml"
    kubectl apply -f "$SCRIPT_DIR/../storage/persistent-volumes.yaml"
    
    log_success "存储配置完成"
}

install_ingress() {
    log_info "安装 Nginx Ingress Controller..."
    
    kubectl apply -f "$SCRIPT_DIR/../ingress/nginx-ingress.yaml"
    
    log_info "等待 Ingress Controller 就绪..."
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=ingress-nginx -n ingress-nginx --timeout=300s
    
    log_success "Ingress Controller 安装完成"
}

create_namespaces() {
    log_info "创建命名空间..."
    
    kubectl apply -f "$SCRIPT_DIR/../namespaces/namespaces.yaml"
    
    log_success "命名空间创建完成"
}

verify_cluster() {
    log_info "验证集群状态..."
    
    echo ""
    log_info "集群节点状态:"
    kubectl get nodes -o wide
    
    echo ""
    log_info "命名空间列表:"
    kubectl get namespaces
    
    echo ""
    log_info "存储类列表:"
    kubectl get storageclass
    
    echo ""
    log_info "Ingress Controller 状态:"
    kubectl get pods -n ingress-nginx
    
    echo ""
    log_info "Calico 网络插件状态:"
    kubectl get pods -n kube-system | grep calico
    
    log_success "集群验证完成"
}

print_access_info() {
    echo ""
    echo "========================================="
    echo -e "${GREEN}Kubernetes 集群部署完成!${NC}"
    echo "========================================="
    echo ""
    echo "访问信息:"
    echo "  - kubectl 上下文: kind-cicd-cluster"
    echo "  - Ingress HTTP 端口: 80"
    echo "  - Ingress HTTPS 端口: 443"
    echo "  - NodePort HTTP: 30000"
    echo "  - NodePort HTTPS: 30001"
    echo ""
    echo "命名空间:"
    echo "  - cicd-system: CI/CD 系统组件"
    echo "  - monitoring: 监控系统"
    echo "  - logging: 日志系统"
    echo "  - dev: 开发环境"
    echo "  - test: 测试环境"
    echo "  - prod: 生产环境"
    echo "  - harbor: 镜像仓库"
    echo "  - argocd: GitOps 工具"
    echo ""
    echo "常用命令:"
    echo "  - 查看集群: kubectl cluster-info"
    echo "  - 查看节点: kubectl get nodes"
    echo "  - 查看所有 Pod: kubectl get pods -A"
    echo "  - 删除集群: kind delete cluster --name cicd-cluster"
    echo ""
}

main() {
    log_info "开始部署 Kubernetes 集群环境..."
    
    check_prerequisites
    create_cluster
    install_calico
    install_storage
    install_ingress
    create_namespaces
    verify_cluster
    print_access_info
    
    log_success "所有任务完成!"
}

main "$@"
