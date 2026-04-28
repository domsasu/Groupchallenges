import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { SiteVariantId, VariantSurfaceConfig } from '../config/siteVariants';
import {
  SITE_VARIANT_OPTIONS,
  SITE_VARIANT_STORAGE_KEY,
  getVariantConfig,
  parseStoredVariant,
} from '../config/siteVariants';

export type { SiteVariantId };

interface SiteVariantContextValue {
  variant: SiteVariantId;
  setVariant: (id: SiteVariantId) => void;
  variantLabel: string;
  surface: VariantSurfaceConfig;
}

const SiteVariantContext = createContext<SiteVariantContextValue | null>(null);

function readInitialVariant(): SiteVariantId {
  try {
    return parseStoredVariant(localStorage.getItem(SITE_VARIANT_STORAGE_KEY));
  } catch {
    return 'version-1';
  }
}

export const SiteVariantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [variant, setVariantState] = useState<SiteVariantId>(readInitialVariant);

  const setVariant = useCallback((id: SiteVariantId) => {
    setVariantState(id);
    try {
      localStorage.setItem(SITE_VARIANT_STORAGE_KEY, id);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const variantLabel =
    SITE_VARIANT_OPTIONS.find((o) => o.id === variant)?.label ?? 'Version 1';

  const surface = useMemo(() => getVariantConfig(variant), [variant]);

  const value = useMemo(
    () => ({ variant, setVariant, variantLabel, surface }),
    [variant, setVariant, variantLabel, surface]
  );

  return (
    <SiteVariantContext.Provider value={value}>{children}</SiteVariantContext.Provider>
  );
};

export function useSiteVariant(): SiteVariantContextValue {
  const ctx = useContext(SiteVariantContext);
  if (!ctx) {
    throw new Error('useSiteVariant must be used within SiteVariantProvider');
  }
  return ctx;
}
