'use client';

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';

type Toast = {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

type State = {
  toasts: Toast[];
};

type Dispatch = (action: { type: 'ADD_TOAST'; toast: Toast } | { type: 'REMOVE_TOAST'; id: string }) => void;

const reducer = (state: State, action: Dispatch): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
};

export function useToast() {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] });

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', id: state.toasts[0]?.id });
    }, 5000);
    return () => clearTimeout(timeout);
  }, [state.toasts]);

  const toast = useCallback(
    ({ title, description, action }: Omit<Toast, 'id'>) => {
      dispatch({
        type: 'ADD_TOAST',
        toast: {
          id: crypto.randomUUID(),
          title,
          description,
          action,
        },
      });
    },
    []
  );

  return { ...state, toast };
}
