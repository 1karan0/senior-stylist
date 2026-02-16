import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const DEFAULT_SEARCH_TIMEOUT_SECONDS = 300;

type FindingStylistModalContextValue = {
  visible: boolean;
  consultationId: number | null;
  searchTimeoutSeconds: number;
  open: (consultationId: number, searchTimeoutSeconds?: number) => void;
  close: () => void;
  setConsultationId: (consultationId: number, searchTimeoutSeconds?: number) => void;
};

const FindingStylistModalContext = createContext<FindingStylistModalContextValue | null>(null);

export const FindingStylistModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [consultationId, setConsultationIdState] = useState<number | null>(null);
  const [searchTimeoutSeconds, setSearchTimeoutSecondsState] = useState<number>(
    DEFAULT_SEARCH_TIMEOUT_SECONDS
  );

  const open = useCallback((id: number, timeoutSeconds?: number) => {
    setConsultationIdState(id);
    setSearchTimeoutSecondsState(
      timeoutSeconds != null && Number.isFinite(timeoutSeconds) && timeoutSeconds > 0
        ? timeoutSeconds
        : DEFAULT_SEARCH_TIMEOUT_SECONDS
    );
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const setConsultationId = useCallback((id: number, timeoutSeconds?: number) => {
    setConsultationIdState(id);
    if (timeoutSeconds != null && Number.isFinite(timeoutSeconds) && timeoutSeconds > 0) {
      setSearchTimeoutSecondsState(timeoutSeconds);
    }
  }, []);

  const value = useMemo(
    () => ({ visible, consultationId, searchTimeoutSeconds, open, close, setConsultationId }),
    [visible, consultationId, searchTimeoutSeconds, open, close, setConsultationId]
  );

  return (
    <FindingStylistModalContext.Provider value={value}>
      {children}
    </FindingStylistModalContext.Provider>
  );
};

export const useFindingStylistModal = (): FindingStylistModalContextValue => {
  const ctx = useContext(FindingStylistModalContext);
  if (!ctx) {
    throw new Error('useFindingStylistModal must be used within FindingStylistModalProvider');
  }
  return ctx;
};
