"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getBorrowables,
  getCatalog,
  getServices,
  type GuestBorrowableItem,
  type GuestCatalogItem,
  type GuestServiceItem,
} from "@/lib/guest-experience-api";

type GuestCatalogBundle = {
  addons: GuestCatalogItem[];
  services: GuestServiceItem[];
  borrowables: GuestBorrowableItem[];
};

type GuestCatalogState = {
  data: GuestCatalogBundle;
  loading: boolean;
  error: string | null;
};

type CachedBundle = {
  data: GuestCatalogBundle;
  fetchedAt: number;
};

const EMPTY_DATA: GuestCatalogBundle = {
  addons: [],
  services: [],
  borrowables: [],
};

const bundleCache = new Map<string, CachedBundle>();
const bundleInflight = new Map<string, Promise<GuestCatalogBundle>>();
const STALE_MS = 5 * 60 * 1000;

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    const candidate =
      "items" in value ? (value as { items?: unknown }).items
      : "data" in value ? (value as { data?: unknown }).data
      : "results" in value ? (value as { results?: unknown }).results
      : null;

    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}

async function fetchCatalogBundle(propertyId: string): Promise<GuestCatalogBundle> {
  const key = propertyId.trim();
  const cached = bundleCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < STALE_MS) {
    return cached.data;
  }

  const inflight = bundleInflight.get(key);
  if (inflight) {
    return inflight;
  }

  const promise = Promise.all([getCatalog(key), getServices(key), getBorrowables(key)])
    .then(([addons, services, borrowables]) => {
      const bundle: GuestCatalogBundle = {
        addons: toArray<GuestCatalogItem>(addons),
        services: toArray<GuestServiceItem>(services),
        borrowables: toArray<GuestBorrowableItem>(borrowables),
      };
      bundleCache.set(key, { data: bundle, fetchedAt: Date.now() });
      return bundle;
    })
    .finally(() => {
      bundleInflight.delete(key);
    });

  bundleInflight.set(key, promise);
  return promise;
}

export function useGuestCatalog(propertyId: string, enabled = true) {
  const normalizedPropertyId = propertyId.trim();
  const cached = bundleCache.get(normalizedPropertyId);
  const [state, setState] = useState<GuestCatalogState>(() => ({
    data: cached?.data ?? EMPTY_DATA,
    loading: enabled && !cached,
    error: null,
  }));

  const loadCatalog = useCallback(async (force = false) => {
    if (!enabled) {
      setState({ data: EMPTY_DATA, loading: false, error: null });
      return;
    }

    if (!normalizedPropertyId) {
      setState({ data: EMPTY_DATA, loading: false, error: "Property is missing." });
      return;
    }

    const cached = bundleCache.get(normalizedPropertyId);
    if (cached && !force) {
      const isStale = Date.now() - cached.fetchedAt >= STALE_MS;
      setState({ data: cached.data, loading: false, error: null });

      if (isStale) {
        void fetchCatalogBundle(normalizedPropertyId)
          .then((fresh) => {
            setState((current) => ({ ...current, data: fresh, error: null }));
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : "Unable to refresh guest catalog.";
            setState((current) => ({ ...current, error: message }));
          });
      }
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const data = await fetchCatalogBundle(normalizedPropertyId);
      setState({ data, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load guest catalog.";
      setState({ data: EMPTY_DATA, loading: false, error: message });
    }
  }, [enabled, normalizedPropertyId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadCatalog();
    });
  }, [loadCatalog]);

  const reload = useCallback(async () => {
    if (!normalizedPropertyId) {
      return;
    }

    bundleCache.delete(normalizedPropertyId);
    bundleInflight.delete(normalizedPropertyId);
    await loadCatalog(true);
  }, [loadCatalog, normalizedPropertyId]);

  return useMemo(
    () => ({
      data: state.data,
      loading: state.loading,
      error: state.error,
      reload,
    }),
    [reload, state.data, state.error, state.loading],
  );
}
