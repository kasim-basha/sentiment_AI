import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { X, AlertCircle } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "warning" | "info";
}

interface ToastContextType {
  addToast: (message: string, type: "warning" | "info") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "warning" | "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg ${
              toast.type === "warning"
                ? "bg-rose-950/90 border-rose-500/50 text-rose-100"
                : "bg-blue-950/90 border-blue-500/50 text-blue-100"
            }`}
          >
            {toast.type === "warning" && <AlertCircle className="w-5 h-5 text-rose-400" />}
            <p className="text-sm font-medium">{toast.message}</p>
            <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>
              <X className="w-4 h-4 opacity-70 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};
