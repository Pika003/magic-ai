import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  User,
  LogOut,
  Search,
  Menu,
  CreditCard,
  GitBranch,
  ShoppingBag,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePaidStatus } from '@/contexts/PaidStatusContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { CommandPalette } from './CommandPalette';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const MOBILE_NAV_ITEMS = [
  { path: '/version-control', label: 'Version Control', icon: GitBranch, description: 'GitHub & GitLab integration' },
  { path: '/action-marketplace', label: 'Action Marketplace', icon: ShoppingBag, description: 'CI/CD workflow templates' },
  { path: '/payment', label: 'Lifetime Pro Deal', icon: CreditCard, description: 'Unlock unlimited access' },
  { path: '/profile', label: 'Profile & Settings', icon: User, description: 'Account settings & keys' },
];

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const { isPaidUser } = usePaidStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const email = user.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <nav className="sticky top-0 left-0 right-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-colors duration-200">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2.5 cursor-pointer group select-none"
                onClick={() => navigate(user ? '/version-control' : '/')}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Magic<span className="text-indigo-600 dark:text-indigo-400">AI</span>
                  </span>
                  <Badge
                    variant="outline"
                    className="hidden sm:inline-flex text-[10px] uppercase font-semibold px-1.5 py-0 border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40"
                  >
                    DevOps
                  </Badge>
                </div>
              </div>
            </div>

            {/* Center Quick Search Button */}
            {user && (
              <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCommandOpen(true)}
                  className="w-full justify-between h-9 px-3 text-xs text-muted-foreground bg-muted/40 hover:bg-muted/70 border-border/60 rounded-lg"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search repositories, workflows...</span>
                  </span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
              </div>
            )}

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Pro / Plan status */}
                  <div className="hidden sm:flex items-center">
                    {isPaidUser ? (
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold px-2.5 py-1 flex items-center gap-1.5 text-xs shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Lifetime Pro</span>
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/payment')}
                        className="h-8 text-xs font-medium border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Upgrade to Pro</span>
                      </Button>
                    )}
                  </div>

                  <NotificationBell />
                  <ThemeToggle />

                  {/* User Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-9 flex items-center gap-2 rounded-full hover:bg-muted"
                      >
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-medium text-xs">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl border-border bg-popover/95 backdrop-blur-md">
                      <DropdownMenuLabel className="font-normal px-2 py-1.5">
                        <div className="flex flex-col space-y-1">
                          <p className="text-xs font-semibold leading-none">{user.email}</p>
                          <p className="text-[11px] leading-none text-muted-foreground">
                            {isPaidUser ? '⚡ Lifetime Member' : 'Free Plan (50 credits/mo)'}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate('/version-control')}
                        className="flex items-center gap-2 cursor-pointer text-xs py-2"
                      >
                        <GitBranch className="w-4 h-4 text-orange-500" />
                        <span>Version Control</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate('/action-marketplace')}
                        className="flex items-center gap-2 cursor-pointer text-xs py-2"
                      >
                        <ShoppingBag className="w-4 h-4 text-indigo-500" />
                        <span>Action Marketplace</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 cursor-pointer text-xs py-2"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Profile & Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate('/payment')}
                        className="flex items-center gap-2 cursor-pointer text-xs py-2"
                      >
                        <CreditCard className="w-4 h-4 text-emerald-500" />
                        <span>{isPaidUser ? 'View Plan Details' : 'Upgrade to Pro (₹499)'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="flex items-center gap-2 cursor-pointer text-xs py-2 text-destructive focus:text-destructive"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Mobile Menu Button */}
                  <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-9 w-9 rounded-lg border border-border/60"
                      >
                        <Menu className="w-5 h-5" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 flex flex-col justify-between">
                      <div>
                        <SheetHeader className="p-4 border-b border-border/70 text-left">
                          <SheetTitle className="flex items-center gap-2 text-base font-bold">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <span>Magic AI</span>
                          </SheetTitle>
                        </SheetHeader>

                        <div className="p-4 space-y-2">
                          {MOBILE_NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                              <button
                                key={item.path}
                                onClick={() => {
                                  navigate(item.path);
                                  setMobileOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                  isActive
                                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                                <div className="text-left">
                                  <div>{item.label}</div>
                                  <div className="text-[11px] opacity-70 font-normal">{item.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-4 border-t border-border/70 bg-muted/20">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMobileOpen(false);
                            handleSignOut();
                          }}
                          className="w-full text-destructive hover:text-destructive justify-start gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
                <>
                  <ThemeToggle />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/auth')}
                    className="text-xs sm:text-sm font-medium"
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20 text-xs sm:text-sm font-medium"
                  >
                    Get Started Free
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Global Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
};
