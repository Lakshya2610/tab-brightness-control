import React from "react";
import { Check } from "lucide-react";

function SuccessNotification({ open }) {
  if (!open) return null;

  return (
    <div className="fixed bottom-3 right-3 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
      <Check className="h-4 w-4" />
      Saved
    </div>
  );
}

export default SuccessNotification;
