import { useState } from 'react';
import { useQuery } from 'react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/ui/pagination';
import { auditService, AuditLog } from '@/services/audit';
import { FileText, RefreshCw, Loader2, Search } from 'lucide-react';

const actionColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  create: 'default',
  update: 'secondary',
  delete: 'destructive',
  login: 'outline',
  logout: 'outline',
  deploy: 'default',
  rollback: 'destructive',
};

const actionLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  login: '登录',
  logout: '登出',
  deploy: '部署',
  rollback: '回滚',
  trigger: '触发',
  approve: '审批',
  reject: '拒绝',
};

function formatTime(dateStr: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['auditLogs', page, pageSize, actionFilter, userFilter],
    queryFn: () =>
      auditService.getAuditLogs({
        page,
        page_size: pageSize,
        action: actionFilter === 'all' ? undefined : actionFilter,
        user_id: userFilter ? Number(userFilter) : undefined,
      }),
  });

  const logs: AuditLog[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="审计日志"
        description="系统操作记录与审计追踪"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            刷新
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">操作类型:</span>
              <Select value={actionFilter} onValueChange={(value) => { setActionFilter(value); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="create">创建</SelectItem>
                  <SelectItem value="update">更新</SelectItem>
                  <SelectItem value="delete">删除</SelectItem>
                  <SelectItem value="login">登录</SelectItem>
                  <SelectItem value="logout">登出</SelectItem>
                  <SelectItem value="deploy">部署</SelectItem>
                  <SelectItem value="rollback">回滚</SelectItem>
                  <SelectItem value="trigger">触发</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">用户ID:</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="输入用户ID"
                  value={userFilter}
                  onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
                  className="pl-10 w-[160px]"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="暂无审计日志"
              description="系统操作记录将在此处显示"
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>操作</TableHead>
                      <TableHead>资源类型</TableHead>
                      <TableHead>资源ID</TableHead>
                      <TableHead>IP地址</TableHead>
                      <TableHead>详情</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatTime(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{log.username || `用户#${log.user_id}`}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionColors[log.action] || 'default'}>
                            {actionLabels[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.resource_type || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{log.resource_id || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{log.ip_address || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground" title={log.details}>
                          {log.details || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  pageSize={pageSize}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
