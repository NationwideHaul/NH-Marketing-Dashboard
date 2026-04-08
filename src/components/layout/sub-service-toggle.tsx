"use client";

import { useAccount } from "@/context/account-context";
import { cn } from "@/lib/utils";

export function SubServiceToggle() {
  const { currentAccount, activeSubService, setActiveSubService } = useAccount();

  if (!currentAccount.subServices?.length) return null;

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
      {currentAccount.subServices.map((sub) => (
        <button
          key={sub.id}
          onClick={() => setActiveSubService(sub.id)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-colors",
            activeSubService === sub.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {sub.name}
        </button>
      ))}
    </div>
  );
}
