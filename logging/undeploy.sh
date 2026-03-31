#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGGING_DIR="${SCRIPT_DIR}"

echo "========================================="
echo "卸载 EFK 日志系统"
echo "========================================="
echo ""

echo "1. 删除 Kibana..."
kubectl delete -f "${LOGGING_DIR}/kibana.yaml" --ignore-not-found=true
echo ""

echo "2. 删除 Fluent Bit..."
kubectl delete -f "${LOGGING_DIR}/fluent-bit.yaml" --ignore-not-found=true
echo ""

echo "3. 删除 ILM 设置 Job..."
kubectl delete -f "${LOGGING_DIR}/ilm-setup.yaml" --ignore-not-found=true
echo ""

echo "4. 删除 Elasticsearch..."
kubectl delete -f "${LOGGING_DIR}/elasticsearch.yaml" --ignore-not-found=true
echo ""

echo "5. 删除存储..."
kubectl delete -f "${LOGGING_DIR}/storage.yaml" --ignore-not-found=true
echo ""

echo "6. 删除命名空间..."
kubectl delete namespace logging --ignore-not-found=true
echo ""

echo "========================================="
echo "卸载完成!"
echo "========================================="
