import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNames: Record<string, string> = {
  '': '数据看板',
  'pipelines': '流水线管理',
  'repositories': '代码仓库',
  'deployments': '部署管理',
  'images': '镜像管理',
  'monitoring': '监控告警',
  'users': '用户管理',
  'settings': '系统设置',
  'profile': '个人信息',
  'audit-logs': '审计日志',
};

export function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) return null;

  const breadcrumbs = [
    { path: '/', label: '首页' },
    ...pathSegments.map((segment, index) => ({
      path: '/' + pathSegments.slice(0, index + 1).join('/'),
      label: routeNames[segment] || segment,
    })),
  ];

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.path} className="flex items-center">
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 mx-1" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-foreground transition-colors"
            >
              {index === 0 ? <Home className="h-3.5 w-3.5" /> : crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
