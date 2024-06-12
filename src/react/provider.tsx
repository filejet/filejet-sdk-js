import React, { ReactNode, createContext, useContext } from 'react';
import { Filejet } from './filejet';

export interface FilejetProviderProps {
  readonly filejet: Filejet;
  readonly children: ReactNode;
}

const context = createContext<Filejet | undefined>(undefined);

export function FilejetProvider(props: FilejetProviderProps) {
  return <context.Provider value={props.filejet}>{props.children}</context.Provider>;
}

export function useFilejet() {
  const filejet = useContext(context);
  if (!filejet) throw new Error('Missing FilejetProvider!');
  return filejet;
}
