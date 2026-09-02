'use client';

import { useCallback, useState } from 'react';
import type { PickedSpreadsheet } from '@/services/types/googleSheets';

// Loaded on demand rather than app-wide: only this one screen needs Google's
// picker script, and pulling it into every page would cost every other page.
const GAPI_SRC = 'https://apis.google.com/js/api.js';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(el);
  });
}

/**
 * Opens Google's own file picker so the admin can choose a spreadsheet.
 *
 * The Picker is not a convenience — it is what the `drive.file` scope requires.
 * That scope only grants access to files the user explicitly picks here (or
 * that we created), which is precisely why we can avoid the broader, sensitive
 * Drive scopes and the verification they would trigger.
 *
 * Needs a short-lived access token of its own: the backend holds the refresh
 * token and never exposes it, so the browser obtains its own token for the
 * duration of the picker.
 */
export function useGooglePicker() {
  const [loading, setLoading] = useState(false);

  const pick = useCallback(async (): Promise<PickedSpreadsheet | null> => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!clientId || !apiKey) {
      throw new Error('Google Picker is not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID / NEXT_PUBLIC_GOOGLE_API_KEY)');
    }

    setLoading(true);
    try {
      await Promise.all([loadScript(GAPI_SRC), loadScript(GIS_SRC)]);
      await new Promise<void>((resolve) => window.gapi.load('picker', () => resolve()));

      const accessToken = await new Promise<string>((resolve, reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: (resp: any) =>
            resp.access_token ? resolve(resp.access_token) : reject(new Error('No access token')),
          error_callback: () => reject(new Error('Google sign-in was cancelled')),
        });
        client.requestAccessToken();
      });

      return await new Promise<PickedSpreadsheet | null>((resolve) => {
        const view = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS)
          .setIncludeFolders(true)
          .setSelectFolderEnabled(false);

        const picker = new window.google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(accessToken)
          .setDeveloperKey(apiKey)
          .setTitle('Choose a spreadsheet')
          .setCallback((data: any) => {
            const { Action, Response, Document } = window.google.picker;
            if (data[Response.ACTION] === Action.PICKED) {
              const doc = data[Response.DOCUMENTS][0];
              resolve({ spreadsheetId: doc[Document.ID], name: doc[Document.NAME] });
            } else if (data[Response.ACTION] === Action.CANCEL) {
              resolve(null);
            }
          })
          .build();

        picker.setVisible(true);
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { pick, loading };
}
