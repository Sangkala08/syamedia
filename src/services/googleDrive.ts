import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory token cache (Do NOT store in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Drive dari autentikasi.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const googleLogout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface DriveSwfFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export const VERBAL_DRIVE_FOLDER_ID = '1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK';
export const VERBAL_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/u/0/folders/1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK';

/**
 * Lists SWF files from the user's Google Drive
 */
export async function listGoogleDriveSwfFiles(token: string): Promise<DriveSwfFile[]> {
  const query = "name contains '.swf' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)&pageSize=100&orderBy=name`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Gagal mengambil daftar file Drive: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Lists ALL files inside a specific Google Drive folder ID
 */
export async function listFilesInDriveFolder(
  folderId: string,
  token: string
): Promise<DriveSwfFile[]> {
  const query = `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)&pageSize=100&orderBy=name`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData.error?.message ||
        `Gagal membaca isi folder Google Drive (${folderId}): HTTP ${response.status}`
    );
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Downloads a binary SWF file from Google Drive using user's access token
 */
export async function downloadDriveSwfBlob(fileId: string, token: string): Promise<Blob> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengunduh file dari Google Drive (Status: ${response.status})`);
  }

  return await response.blob();
}

/**
 * Extracts Google Drive Folder ID from folder shareable links
 * Supports:
 * - https://drive.google.com/drive/u/0/folders/1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK
 * - https://drive.google.com/drive/folders/1-WfkBaYgucn27NWD-ckXUcYBXxs_EqHK?usp=sharing
 */
export function extractDriveFolderId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  const matchFolder = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (matchFolder && matchFolder[1]) {
    return matchFolder[1];
  }

  return null;
}

/**
 * Extracts Google Drive file ID from standard shareable links
 * Supports:
 * - https://drive.google.com/file/d/1a2B3c4D5e.../view?usp=sharing
 * - https://drive.google.com/open?id=1a2B3c4D5e...
 * - https://drive.google.com/uc?id=1a2B3c4D5e...
 * - or raw file ID string
 */
export function extractDriveFileId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Do not treat folder URLs as single file IDs
  if (trimmed.includes('/folders/')) {
    return null;
  }

  // If already a plain ID without slashes
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  // /file/d/ID
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // id=ID or &id=ID
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  return null;
}

/**
 * Attempts to download a publicly shared Google Drive file directly or with token
 */
export async function downloadSharedDriveFile(fileId: string, token?: string | null): Promise<Blob> {
  // If token is available, use Google Drive API directly
  if (token) {
    return downloadDriveSwfBlob(fileId, token);
  }

  // Otherwise, use public direct download URL
  const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  try {
    const res = await fetch(publicUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.blob();
  } catch (err) {
    // If CORS prevents direct browser download from public uc link, prompt user to sign in
    throw new Error('File Google Drive memerlukan izin akses. Silakan Masuk dengan Google Drive.');
  }
}
