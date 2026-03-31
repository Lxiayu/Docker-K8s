#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "PostgreSQL Database Cleanup Script"
echo "========================================="
echo ""

read -p "Are you sure you want to delete the PostgreSQL deployment? This will delete all data! (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo ""
echo "Deleting monitoring..."
kubectl delete -f "${DATABASE_DIR}/monitoring/servicemonitor.yaml" --ignore-not-found=true

echo ""
echo "Deleting backup jobs..."
kubectl delete -f "${DATABASE_DIR}/backup/cronjob.yaml" --ignore-not-found=true
kubectl delete -f "${DATABASE_DIR}/backup/scripts.yaml" --ignore-not-found=true

echo ""
echo "Deleting PostgreSQL..."
kubectl delete -f "${DATABASE_DIR}/postgres/statefulset.yaml" --ignore-not-found=true
kubectl delete -f "${DATABASE_DIR}/postgres/service.yaml" --ignore-not-found=true

echo ""
echo "Deleting PVCs..."
kubectl delete -f "${DATABASE_DIR}/postgres/pvc.yaml" --ignore-not-found=true

echo ""
echo "Deleting ConfigMaps..."
kubectl delete -f "${DATABASE_DIR}/postgres/configmap-init-scripts.yaml" --ignore-not-found=true
kubectl delete -f "${DATABASE_DIR}/postgres/configmap.yaml" --ignore-not-found=true

echo ""
echo "Deleting secrets..."
kubectl delete -f "${DATABASE_DIR}/postgres/secret.yaml" --ignore-not-found=true

echo ""
echo "Deleting namespace..."
kubectl delete -f "${DATABASE_DIR}/namespace.yaml" --ignore-not-found=true

echo ""
echo "✓ Cleanup completed"
