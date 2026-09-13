// ═══════════════════════════════════════════════════════════════════════════
//  Google Drive Service - LogINV v2.0
//  Servicio para integración con Google Drive para almacenamiento de imágenes
// ═══════════════════════════════════════════════════════════════════════════

import { GOOGLE_DRIVE, APP_CONFIG } from '@/lib/constants';

// ─── State ───────────────────────────────────────────────────────────────
let gapi = null;
let gis = null;
let tokenClient = null;
let accessToken = null;

// ─── Initialize Google APIs ──────────────────────────────────────────────
export async function initGoogleDrive() {
    if (typeof window === 'undefined') return false;
    
    try {
        // Load Google API script
        if (!window.gapi) {
            await loadScript('https://apis.google.com/js/api.js');
        }
        gapi = window.gapi;
        
        // Load Google Identity Services
        if (!window.google?.accounts) {
            await loadScript('https://accounts.google.com/gsi/client');
        }
        gis = window.google;
        
        // Initialize GAPI client
        await new Promise((resolve) => gapi.load('client:picker', resolve));
        await gapi.client.init({
            apiKey: GOOGLE_DRIVE.API_KEY,
            discoveryDocs: GOOGLE_DRIVE.DISCOVERY_DOCS,
        });
        
        // Initialize token client
        tokenClient = gis.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_DRIVE.CLIENT_ID,
            scope: GOOGLE_DRIVE.SCOPE,
            callback: (tokenResponse) => {
                accessToken = tokenResponse.access_token;
            },
        });
        
        return true;
    } catch (error) {
        console.error('[LogINV] Error initializing Google Drive:', error);
        return false;
    }
}

// ─── Load external script ────────────────────────────────────────────────
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ─── Request access token ────────────────────────────────────────────────
export function requestAccessToken() {
    if (!tokenClient) {
        throw new Error('Google Drive not initialized');
    }
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

// ─── Check if authorized ─────────────────────────────────────────────────
export function isAuthorized() {
    return !!accessToken;
}

// ─── Sign out ────────────────────────────────────────────────────────────
export function signOut() {
    if (accessToken) {
        google.accounts.oauth2.revoke(accessToken);
        accessToken = null;
    }
}

// ─── Upload image to Google Drive ────────────────────────────────────────
export async function uploadImage(file, folderId = null) {
    if (!accessToken) {
        throw new Error('Not authorized. Please sign in first.');
    }
    
    // Validate file
    if (file.size > APP_CONFIG.MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        throw new Error(`File size exceeds ${APP_CONFIG.MAX_UPLOAD_SIZE_MB}MB limit`);
    }
    
    if (!APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
    }
    
    try {
        // Create folder if needed
        if (!folderId) {
            folderId = await getOrCreateFolder(APP_CONFIG.FOLDER_NAME);
        }
        
        // Upload file
        const metadata = {
            name: `${Date.now()}_${file.name}`,
            parents: [folderId],
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);
        
        const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: form,
            }
        );
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const result = await response.json();
        return {
            id: result.id,
            name: result.name,
            webViewLink: `https://drive.google.com/file/d/${result.id}/view`,
            directLink: `https://drive.google.com/uc?export=view&id=${result.id}`,
        };
    } catch (error) {
        console.error('[LogINV] Error uploading image:', error);
        throw error;
    }
}

// ─── Delete image from Google Drive ──────────────────────────────────────
export async function deleteImage(fileId) {
    if (!accessToken) {
        throw new Error('Not authorized');
    }
    
    try {
        await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        return true;
    } catch (error) {
        console.error('[LogINV] Error deleting image:', error);
        throw error;
    }
}

// ─── Get or create folder ────────────────────────────────────────────────
export async function getOrCreateFolder(folderName) {
    if (!accessToken) {
        throw new Error('Not authorized');
    }
    
    // Search for existing folder
    const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
    
    const result = await response.json();
    
    if (result.files && result.files.length > 0) {
        return result.files[0].id;
    }
    
    // Create new folder
    const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    };
    
    const createResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(folderMetadata),
        }
    );
    
    const folder = await createResponse.json();
    return folder.id;
}

// ─── Get images from folder ──────────────────────────────────────────────
export async function getImages(folderId) {
    if (!accessToken) {
        throw new Error('Not authorized');
    }
    
    try {
        const query = `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`;
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,mimeType)&orderBy=createdTime desc`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        
        const result = await response.json();
        return (result.files || []).map(file => ({
            id: file.id,
            name: file.name,
            webViewLink: file.webViewLink,
            directLink: `https://drive.google.com/uc?export=view&id=${file.id}`,
            mimeType: file.mimeType,
        }));
    } catch (error) {
        console.error('[LogINV] Error getting images:', error);
        throw error;
    }
}

// ─── Hook for React components ───────────────────────────────────────────
export function useGoogleDrive() {
    const [initialized, setInitialized] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        initGoogleDrive().then(ok => {
            setInitialized(ok);
            setAuthorized(isAuthorized());
        });
    }, []);
    
    const upload = useCallback(async (file, folderId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await uploadImage(file, folderId);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);
    
    const remove = useCallback(async (fileId) => {
        setLoading(true);
        setError(null);
        try {
            await deleteImage(fileId);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);
    
    const authorize = useCallback(() => {
        requestAccessToken();
    }, []);
    
    const logout = useCallback(() => {
        signOut();
        setAuthorized(false);
    }, []);
    
    return {
        initialized,
        authorized,
        loading,
        error,
        upload,
        remove,
        authorize,
        logout,
    };
}
