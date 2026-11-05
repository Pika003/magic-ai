import React from 'react';
import { Button } from '@/components/ui/button';
import {
  GitBranch,
  ShoppingBag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
  User,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePaidStatus } from '@/contexts/PaidStatusContext';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface NavItem {
  path: string;
  label: string;
  description: string;
  icon: React.ElementType;
  matchPrefix: string;
  badge?: string;
}

const CORE_NAV_ITEMS: NavItem[] = [
  {
    path: '/version-control',
    label: 'Version Control',
    description: 'GitHub & GitLab integration',
    icon: GitBranch,
    matchPrefix: '/version-control',
  },
  {
    path: '/action-marketplace',
    label: 'Action Marketplace',
    description: 'CI/CD workflow templates',
    icon: ShoppingBag,
    matchPrefix: '/action-marketplace',
  },
];

export const Sidebar = ({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPaidUser } = usePaidStatus();
  const { totalUsage } = useUsageTracking();

  const usagePercent = Math.min(Math.round(((totalUsage || 0) / 50) * 100), 100);

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] border-r border-border/70 bg-card/60 backdrop-blur-xl transition-all duration-300 z-30 flex flex-col justify-between ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {!collapsed && (
          <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Platform Hub
          </h3>
        )}

        <div className="space-y-1">
          {CORE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.matchPrefix);

            const navButton = (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-primary-foreground' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] truncate ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/70'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                  <TooltipContent side="right" className="flex flex-col gap-0.5">
                    <span className="font-semibold text-xs">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.description}</span>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navButton;
          })}
        </div>
      </div>

      {/* Bottom Area: Plan status & Collapse button */}
      <div className="p-3 border-t border-border/70 space-y-3 bg-muted/20">
        {!collapsed ? (
          isPaidUser ? (
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/25">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Zap className="w-3 h-3 fill-current" />
                </div>
                <div className="font-bold text-xs text-foreground">Lifetime Unlimited</div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Unlimited repository operations & CI/CD workflows unlocked.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-card border border-border shadow-sm space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground text-[11px]">Free Usage</span>
                <span className="font-bold text-foreground text-[11px]">{totalUsage}/50</span>
              </div>
              <Progress value={usagePercent} className="h-1.5 bg-muted" />
              <Button
                size="sm"
                onClick={() => navigate('/payment')}
                className="w-full h-7 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-sm"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Unlock Lifetime ₹499
              </Button>
            </div>
          )
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate('/payment')}
                className="w-full flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-500"
              >
                <Zap className="w-4 h-4 fill-current" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isPaidUser ? 'Lifetime Unlimited Pro' : 'Free Plan - Click to Upgrade'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Toggle Collapse Button */}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 rounded-lg border border-border/50"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        )}
      </div>
    </aside>
  );
};
