import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type FindingStylistModalContextValue = {
  visible: boolean;
  consultationId: number | null;
  open: (consultationId: number) => void;
  close: () => void;
  setConsultationId: (consultationId: number) => void;
};

const FindingStylistModalContext = createContext<FindingStylistModalContextValue | null>(null);

export const FindingStylistModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [consultationId, setConsultationIdState] = useState<number | null>(null);

  const open = useCallback((id: number) => {
    setConsultationIdState(id);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const setConsultationId = useCallback((id: number) => {
    setConsultationIdState(id);
  }, []);

  const value = useMemo(
    () => ({ visible, consultationId, open, close, setConsultationId }),
    [visible, consultationId, open, close, setConsultationId]
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
