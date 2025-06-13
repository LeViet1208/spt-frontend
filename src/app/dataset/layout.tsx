'use client';

import React, { createContext, ReactNode, useContext, useState } from 'react';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface BackContextType {
  setCustomBack: (fn: () => void) => void;
}

const BackContext = createContext<BackContextType | undefined>(undefined);

export const useBack = () => {
  const ctx = useContext(BackContext);
  if (!ctx) {
    throw new Error('useBack must be used within DatasetLayout');
  }
  return ctx;
};

interface DatasetLayoutProps {
  children: ReactNode;
  isSubmitting?: boolean;
}

const DatasetLayout = ({ children, isSubmitting = false }: DatasetLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();

  // State lưu hàm back custom do page con đăng ký
  const [customBack, setCustomBack] = useState<(() => void) | null>(null);

  // Hàm back mặc định
  const defaultBack = () => {
    router.push('/dashboard');
  };

  // Xử lý back: ưu tiên customBack nếu có
  const handleBack = () => {
    if (customBack) {
      customBack();
    } else {
      defaultBack();
    }
  };

  // Tiêu đề, phụ đề
  let title = 'SPT Analytics';
  let subtitle = '';

  if (pathname === '/dataset/add') {
    subtitle = 'Add New Dataset';
  } else if (pathname === '/dataset') {
    subtitle = 'Dataset List';
  } else if (pathname.match(/^\/dataset\/[^/]+$/)) {
    subtitle = 'Dataset Details';
  }

  return (
    <BackContext.Provider value={{ setCustomBack }}>
      <div>
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
              </div>
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </BackContext.Provider>
  );
};

export default DatasetLayout;
