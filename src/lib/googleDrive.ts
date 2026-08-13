import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleDriveSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token Google Drive dari autentikasi.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const googleDriveLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

// Upload backup object directly to Google Drive
export const uploadBackupToGoogleDrive = async (
  backupObject: any,
  fileName: string
): Promise<{ id: string; name: string }> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Pengguna belum terhubung dengan Google Drive. Silakan login terlebih dahulu.');
  }

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'Cadangan otomatis Sistem POS Jersey ATHREE'
  };

  const fileContent = JSON.stringify(backupObject, null, 2);
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal mengunggah cadangan ke Google Drive: ${errText}`);
  }

  const result = await response.json();
  return { id: result.id, name: result.name };
};

// List files backed up on Drive
export const listDriveBackups = async (): Promise<DriveBackupFile[]> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Pengguna belum terhubung dengan Google Drive.');
  }

  const query = encodeURIComponent("name contains 'cadangan' or name contains 'backup' or mimeType = 'application/json'");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size)&orderBy=createdTime%20desc&pageSize=20`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal mengambil daftar cadangan dari Google Drive: ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
};

// Download backup content from Google Drive
export const downloadDriveBackup = async (fileId: string): Promise<any> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Pengguna belum terhubung dengan Google Drive.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal mengunduh berkas dari Google Drive: ${errText}`);
  }

  return await response.json();
};
