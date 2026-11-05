import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  GitBranch,
  ShoppingBag,
  User,
  CreditCard,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, setOpen]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or jump to feature..." />
      <CommandList className="max-h-80">
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Platform Operations">
          <CommandItem
            onSelect={() => handleSelect(() => navigate("/version-control"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <GitBranch className="w-4 h-4 text-orange-500" />
            <span>Version Control (GitHub & GitLab Repos)</span>
            <CommandShortcut>G V</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => navigate("/action-marketplace"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-500" />
            <span>Action Marketplace (CI/CD Workflows)</span>
            <CommandShortcut>G A</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account & Billing">
          <CommandItem
            onSelect={() => handleSelect(() => navigate("/payment"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>Lifetime Unlimited Plan (₹499)</span>
            <CommandShortcut>PRO</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => navigate("/profile"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>Profile & Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme Settings">
          <CommandItem
            onSelect={() => handleSelect(() => setTheme("light"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Switch to Light Theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setTheme("dark"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Switch to Dark Theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => setTheme("system"))}
            className="flex items-center gap-2 cursor-pointer py-2.5"
          >
            <Monitor className="w-4 h-4 text-slate-400" />
            <span>Use System Theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
