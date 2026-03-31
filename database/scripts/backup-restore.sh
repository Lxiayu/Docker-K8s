#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_usage() {
    echo "PostgreSQL Backup and Restore Tool"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  backup              Create a manual backup"
    echo "  list                List all available backups"
    echo "  restore <file>      Restore from a backup file"
    echo "  download <file>     Download a backup file to local machine"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 list"
    echo "  $0 restore /backup/cicd_platform_20240101_020000.sql.gz"
    echo "  $0 download /backup/cicd_platform_20240101_020000.sql.gz"
}

create_backup() {
    echo "Creating manual backup..."
    kubectl create job --from=cronjob/postgres-backup "manual-backup-$(date +%s)" -n database
    echo "✓ Backup job created. Check status with: kubectl get jobs -n database"
}

list_backups() {
    echo "Listing available backups..."
    echo ""
    kubectl exec -it -n database statefulset/postgres -- /bin/sh -c "
        echo '=== Daily Backups ==='
        ls -lh /backup/*.sql.gz 2>/dev/null || echo 'No daily backups found'
        echo ''
        echo '=== Weekly Backups ==='
        ls -lh /backup/weekly/*.sql.gz 2>/dev/null || echo 'No weekly backups found'
        echo ''
        echo '=== Manual Backups ==='
        ls -lh /backup/manual/*.sql.gz 2>/dev/null || echo 'No manual backups found'
    "
}

restore_backup() {
    if [ -z "$1" ]; then
        echo "Error: Backup file not specified"
        show_usage
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    echo "Warning: This will replace the current database!"
    read -p "Are you sure you want to restore from ${BACKUP_FILE}? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "Restore cancelled"
        exit 0
    fi
    
    echo "Restoring from ${BACKUP_FILE}..."
    
    kubectl exec -it -n database statefulset/postgres -- /bin/sh -c "
        gunzip -c ${BACKUP_FILE} | psql -U cicd_admin -d cicd_platform
    "
    
    echo "✓ Restore completed"
}

download_backup() {
    if [ -z "$1" ]; then
        echo "Error: Backup file not specified"
        show_usage
        exit 1
    fi
    
    BACKUP_FILE="$1"
    LOCAL_FILE=$(basename "$BACKUP_FILE")
    
    echo "Downloading ${BACKUP_FILE} to ${LOCAL_FILE}..."
    kubectl cp database/postgres-0:${BACKUP_FILE} ${LOCAL_FILE}
    
    echo "✓ Download completed: ${LOCAL_FILE}"
}

case "$1" in
    backup)
        create_backup
        ;;
    list)
        list_backups
        ;;
    restore)
        restore_backup "$2"
        ;;
    download)
        download_backup "$2"
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
