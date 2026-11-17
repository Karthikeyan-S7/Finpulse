import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} — FinPulse` : 'FinPulse — Personal Finance';
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
