#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "PostgreSQL Database Deployment Script"
echo "========================================="
echo ""

check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo "Error: kubectl is not installed"
        exit 1
    fi
    echo "✓ kubectl is installed"
}

check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        echo "Error: Cannot connect to Kubernetes cluster"
        exit 1
    fi
    echo "✓ Connected to Kubernetes cluster"
}

deploy_namespace() {
    echo ""
    echo "Step 1: Creating namespace..."
    kubectl apply -f "${DATABASE_DIR}/namespace.yaml"
    echo "✓ Namespace created"
}

deploy_secrets() {
    echo ""
    echo "Step 2: Creating secrets..."
    kubectl apply -f "${DATABASE_DIR}/postgres/secret.yaml"
    echo "✓ Secrets created"
}

deploy_configmaps() {
    echo ""
    echo "Step 3: Creating ConfigMaps..."
    kubectl apply -f "${DATABASE_DIR}/postgres/configmap.yaml"
    kubectl apply -f "${DATABASE_DIR}/postgres/configmap-init-scripts.yaml"
    echo "✓ ConfigMaps created"
}

deploy_pvc() {
    echo ""
    echo "Step 4: Creating PersistentVolumeClaims..."
    kubectl apply -f "${DATABASE_DIR}/postgres/pvc.yaml"
    echo "✓ PVCs created"
}

deploy_postgres() {
    echo ""
    echo "Step 5: Deploying PostgreSQL..."
    kubectl apply -f "${DATABASE_DIR}/postgres/service.yaml"
    kubectl apply -f "${DATABASE_DIR}/postgres/statefulset.yaml"
    echo "✓ PostgreSQL deployed"
}

wait_for_postgres() {
    echo ""
    echo "Step 6: Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n database --timeout=300s
    echo "✓ PostgreSQL is ready"
}

deploy_backup() {
    echo ""
    echo "Step 7: Deploying backup jobs..."
    kubectl apply -f "${DATABASE_DIR}/backup/scripts.yaml"
    kubectl apply -f "${DATABASE_DIR}/backup/cronjob.yaml"
    echo "✓ Backup jobs deployed"
}

deploy_monitoring() {
    echo ""
    echo "Step 8: Deploying monitoring..."
    kubectl apply -f "${DATABASE_DIR}/monitoring/servicemonitor.yaml"
    echo "✓ Monitoring deployed"
}

verify_deployment() {
    echo ""
    echo "Step 9: Verifying deployment..."
    
    echo ""
    echo "Pods:"
    kubectl get pods -n database
    
    echo ""
    echo "Services:"
    kubectl get services -n database
    
    echo ""
    echo "PVCs:"
    kubectl get pvc -n database
    
    echo ""
    echo "CronJobs:"
    kubectl get cronjobs -n database
}

show_connection_info() {
    echo ""
    echo "========================================="
    echo "Deployment Complete!"
    echo "========================================="
    echo ""
    echo "Connection Information:"
    echo "  Host: postgres-service.database.svc.cluster.local"
    echo "  Port: 5432"
    echo "  Database: cicd_platform"
    echo "  Admin User: cicd_admin"
    echo ""
    echo "To connect to the database:"
    echo "  kubectl exec -it -n database statefulset/postgres -- psql -U cicd_admin -d cicd_platform"
    echo ""
    echo "To view logs:"
    echo "  kubectl logs -n database -l app.kubernetes.io/name=postgresql"
    echo ""
    echo "To trigger a manual backup:"
    echo "  kubectl create job --from=cronjob/postgres-backup manual-backup-$(date +%s) -n database"
    echo ""
}

main() {
    check_kubectl
    check_cluster
    deploy_namespace
    deploy_secrets
    deploy_configmaps
    deploy_pvc
    deploy_postgres
    wait_for_postgres
    deploy_backup
    deploy_monitoring
    verify_deployment
    show_connection_info
}

main "$@"
