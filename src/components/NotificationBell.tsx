
import React from 'react';
import { Bell, X, Calendar, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, dismissNotification, markNotificationAsRead } from '@/services/notificationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
}

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'meeting':
      return <Calendar className="w-4 h-4 text-blue-500" />;
    case 'project_update':
      return <Briefcase className="w-4 h-4 text-green-500" />;
    default:
      return <Bell className="w-4 h-4 text-slate-500" />;
  }
};

export const NotificationBell = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
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
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 min-w-4 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications && notifications.length > 0 ? (
              <ul className="max-h-96 overflow-y-auto">
                {notifications.map((n: Notification) => (
                  <li
                    key={n.id}
                    className={cn(
                      'p-3 border-b border-slate-100 flex items-start space-x-3',
                      !n.is_read && 'bg-blue-50'
                    )}
                  >
                    <NotificationIcon type={n.type} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-sm text-slate-500">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => dismissMutation.mutate(n.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                You have no new notifications.
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
