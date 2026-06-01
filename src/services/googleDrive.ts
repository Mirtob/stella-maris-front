/**
 * 📁 Google Drive Service - Stella Maris
 * 
 * Servicio para integración con Google Drive API.
 * Funcionalidades:
 * - Subir partituras (PDFs)
 * - Descargar archivos
 * - Obtener URLs públicas
 * - Gestionar permisos
 * 
 * 📚 Para configurar Google Drive API, ver: /docs/GOOGLE_OAUTH_INTEGRATION.md
 */

import { GOOGLE_DRIVE_CONFIG } from '../config/api';

// ==========================================
// 🔧 TIPOS
// ==========================================

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
  iconLink: string;
}

export interface UploadOptions {
  fileName: string;
  mimeType: string;
  folderId?: string;
  description?: string;
  makePublic?: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ==========================================
// 🎯 UTILIDADES
// ==========================================

export function extractFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{25,})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function isValidFileId(fileId: string): boolean {
  return /^[a-zA-Z0-9_-]{25,}$/.test(fileId);
}

export function getPublicUrl(fileId: string): string {
  return GOOGLE_DRIVE_CONFIG.urls.publicFile(fileId);
}

export function getDownloadUrl(fileId: string): string {
  return GOOGLE_DRIVE_CONFIG.urls.download(fileId);
}

export function getPreviewUrl(fileId: string): string {
  return GOOGLE_DRIVE_CONFIG.urls.preview(fileId);
}

export function getThumbnailUrl(fileId: string, size: number = 400): string {
  return GOOGLE_DRIVE_CONFIG.urls.thumbnail(fileId, size);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function createDriveHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function getFriendlyFileInfo(response: any): DriveFile {
  return {
    id: response.id,
    name: response.name,
    mimeType: response.mimeType,
    size: Number(response.size || 0),
    createdTime: response.createdTime || new Date().toISOString(),
    modifiedTime: response.modifiedTime || new Date().toISOString(),
    webViewLink: response.webViewLink || getPublicUrl(response.id),
    webContentLink: response.webContentLink || getDownloadUrl(response.id),
    thumbnailLink: response.thumbnailLink,
    iconLink: response.iconLink || 'https://drive-thirdparty.googleusercontent.com/16/type/application/pdf',
  };
}

// ==========================================
// 📡 API CALLS
// ==========================================

export async function uploadFile(
  file: File,
  options: UploadOptions,
  accessToken: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ success: boolean; file?: DriveFile; error?: string }> {
  if (!accessToken) {
    return {
      success: false,
      error: 'Google Drive access token is required for uploads.',
    };
  }

  if (file.size > GOOGLE_DRIVE_CONFIG.upload.maxFileSize) {
    return {
      success: false,
      error: `El archivo supera el límite de ${formatFileSize(GOOGLE_DRIVE_CONFIG.upload.maxFileSize)}`,
    };
  }

  if (!GOOGLE_DRIVE_CONFIG.upload.allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `Tipo de archivo no permitido: ${file.type}`,
    };
  }

  try {
    const metadata = {
      name: options.fileName,
      mimeType: options.mimeType,
      description: options.description || '',
      parents: options.folderId ? [options.folderId] : [],
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: (event.loaded / event.total) * 100,
          });
        }
      });
    }

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink,iconLink';

    const response = await new Promise<XMLHttpRequest>((resolve, reject) => {
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

      xhr.addEventListener('load', () => resolve(xhr));
      xhr.addEventListener('error', () => reject(new Error('Error en la conexión a Google Drive')));
      xhr.addEventListener('abort', () => reject(new Error('Upload abortado')));
      xhr.send(formData);
    });

    if (response.status !== 200) {
      const errorText = response.responseText ? response.responseText : `HTTP ${response.status}`;
      return {
        success: false,
        error: `Error subiendo archivo: ${errorText}`,
      };
    }

    const data = JSON.parse(response.responseText);
    const driveFile = getFriendlyFileInfo(data);

    if (options.makePublic) {
      await makeFilePublic(driveFile.id, accessToken);
    }

    return {
      success: true,
      file: driveFile,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Error subiendo archivo a Google Drive.',
    };
  }
}

export async function uploadSheetMusic(
  file: File,
  songTitle: string,
  accessToken: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ success: boolean; file?: DriveFile; error?: string }> {
  const extension = file.type === GOOGLE_DRIVE_CONFIG.mimeTypes.pdf ? 'pdf' : file.type.split('/')[1] || 'pdf';
  const fileName = `${songTitle.replace(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ ]/g, '_')}_partitura.${extension}`;

  return uploadFile(
    file,
    {
      fileName,
      mimeType: file.type || GOOGLE_DRIVE_CONFIG.mimeTypes.pdf,
      folderId: GOOGLE_DRIVE_CONFIG.folders.sheetMusic,
      description: `Partitura de ${songTitle}`,
      makePublic: false, // Mantener partituras privadas por defecto para proteger archivos críticos
    },
    accessToken,
    onProgress
  );
}

export async function getFileInfo(fileId: string, accessToken: string): Promise<DriveFile | null> {
  if (!isValidFileId(fileId)) {
    console.error('❌ File ID inválido:', fileId);
    return null;
  }

  if (!accessToken) {
    console.error('❌ Access token requerido para obtener información de archivo');
    return null;
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink,iconLink`;
    const response = await fetch(url, {
      headers: createDriveHeaders(accessToken),
    });

    if (!response.ok) {
      console.error('❌ Error obteniendo archivo:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return getFriendlyFileInfo(data);
  } catch (error) {
    console.error('❌ Error obteniendo archivo:', error);
    return null;
  }
}

export async function listFiles(
  query: string,
  accessToken: string,
  pageSize: number = 10
): Promise<DriveFile[]> {
  if (!accessToken) {
    console.error('❌ Access token requerido para listar archivos');
    return [];
  }

  try {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.append('q', query);
    url.searchParams.append('pageSize', pageSize.toString());
    url.searchParams.append('fields', 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink,iconLink)');
    url.searchParams.append('spaces', 'drive');

    const response = await fetch(url.toString(), {
      headers: createDriveHeaders(accessToken),
    });

    if (!response.ok) {
      console.error('❌ Error listando archivos:', response.status, await response.text());
      return [];
    }

    const data = await response.json();
    return (data.files || []).map(getFriendlyFileInfo);
  } catch (error) {
    console.error('❌ Error listando archivos:', error);
    return [];
  }
}

export async function deleteFile(fileId: string, accessToken: string): Promise<boolean> {
  if (!isValidFileId(fileId)) {
    console.error('❌ File ID inválido:', fileId);
    return false;
  }

  if (!accessToken) {
    console.error('❌ Access token requerido para eliminar archivo');
    return false;
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: createDriveHeaders(accessToken),
    });

    if (!response.ok) {
      console.error('❌ Error eliminando archivo:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error eliminando archivo:', error);
    return false;
  }
}

export async function makeFilePublic(fileId: string, accessToken: string): Promise<boolean> {
  if (!isValidFileId(fileId)) {
    console.error('❌ File ID inválido:', fileId);
    return false;
  }

  if (!accessToken) {
    console.error('❌ Access token requerido para permisos públicos');
    return false;
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`;
    const permission = {
      role: 'reader',
      type: 'anyone',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...createDriveHeaders(accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(permission),
    });

    if (!response.ok) {
      console.error('❌ Error haciendo archivo público:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error haciendo archivo público:', error);
    return false;
  }
}

export async function downloadFile(fileId: string, fileName: string): Promise<boolean> {
  try {
    const url = getDownloadUrl(fileId);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('❌ Error descargando archivo:', error);
    return false;
  }
}

export async function createFolder(
  folderName: string,
  parentFolderId: string | null,
  accessToken: string
): Promise<{ success: boolean; folderId?: string; error?: string }> {
  if (!accessToken) {
    return {
      success: false,
      error: 'Google Drive access token is required to create folders.',
    };
  }

  try {
    const metadata = {
      name: folderName,
      mimeType: GOOGLE_DRIVE_CONFIG.mimeTypes.folder,
      parents: parentFolderId ? [parentFolderId] : [],
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        ...createDriveHeaders(accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Error creando carpeta: ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      folderId: data.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Error creando carpeta en Google Drive.',
    };
  }
}

export default {
  extractFileId,
  isValidFileId,
  getPublicUrl,
  getDownloadUrl,
  getPreviewUrl,
  getThumbnailUrl,
  formatFileSize,
  uploadFile,
  uploadSheetMusic,
  getFileInfo,
  listFiles,
  deleteFile,
  makeFilePublic,
  downloadFile,
  createFolder,
};
