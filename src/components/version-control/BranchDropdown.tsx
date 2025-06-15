
import React from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface BranchDropdownProps {
  branches: string[];
  value: string;
  onChange: (branch: string) => void;
  loading?: boolean;
  error?: string | null;
}

export const BranchDropdown: React.FC<BranchDropdownProps> = ({
  branches,
  value,
  onChange,
  loading,
  error
}) => {
  if (loading) return <span className="text-xs text-muted-foreground">Loading branches...</span>;
  if (error) return <span className="text-xs text-red-500">{error}</span>;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto min-w-[120px] h-8 text-xs">
        <SelectValue placeholder="Select Branch" />
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch} value={branch} className="text-xs">
            {branch}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
