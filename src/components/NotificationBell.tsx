import React from 'react';
import { Bell, X, Calendar, Briefcase, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, dismissNotification, markNotificationAsRead } from '@/services/notificationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

type Notification = {
  id: string;
  created_at: string;
  is_dismissed: boolean;
  is_read: boolean;
  message: string;
  project_id: string | null;
  scheduled_for: string | null;
  title: string;
  type: string;
  updated_at: string;
  user_id: string;
};

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'meeting':
      return <Calendar className="w-4 h-4 text-blue-500 shrink-0" />;
    case 'project_update':
      return <Briefcase className="w-4 h-4 text-emerald-500 shrink-0" />;
    default:
      return <Bell className="w-4 h-4 text-indigo-500 shrink-0" />;
  }
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user,
    refetchInterval: 60000,
  });

  const dismissMutation = useMutation({
    mutationFn: dismissNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      notifications?.forEach(n => {
        if (!n.is_read) {
          markAsReadMutation.mutate(n.id);
        }
      });
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg border border-transparent hover:border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-xl border-border bg-popover/95 backdrop-blur-md" align="end">
        <div className="p-3.5 border-b border-border/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-xs text-foreground">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>

        <div className="p-0">
          {notifications && notifications.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border/60">
              {notifications.map((n: Notification) => (
                <li
                  key={n.id}
                  className={cn(
                    'p-3 flex items-start gap-3 transition-colors',
                    !n.is_read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/40'
                  )}
                >
                  <NotificationIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => dismissMutation.mutate(n.id)}
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
              <p className="font-medium">You're all caught up!</p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">No new notifications</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
