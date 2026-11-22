// ═══════════════════════════════════════════════════════════════════════════
//  Operaciones de escritura comunes (Firestore o datos de demostración)
//  Centraliza alta/edición/borrado para que todos los hooks compartan el
//  mismo manejo de errores y limpien valores `undefined` (Firestore los
//  rechaza con "Unsupported field value: undefined").
// ═══════════════════════════════════════════════════════════════════════════

import { USE_MOCK, getFirestore, firebaseError } from '@/hooks/useFirestoreQuery';
import { getMock, setMock, mockId, mockTimestamp } from '@/lib/mockStore';

/** Elimina claves con valor `undefined` (en el primer nivel y en objetos anidados simples). */
export function clean(data) {
    if (Array.isArray(data)) return data.map(clean);
    if (!data || typeof data !== 'object' || data.constructor !== Object) return data;
    return Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined).map(([k, v]) => [k, clean(v)])
    );
}

export const nowIso = () => new Date().toISOString();
/** Valor de fecha "ahora" apropiado para cada modo. */
export const nowValue = () => (USE_MOCK ? mockTimestamp() : nowIso());

export async function addDocument(collection, data, { prefix = collection, prepend = true } = {}) {
    const payload = clean(data);
    if (USE_MOCK) {
        const id = mockId(prefix);
        setMock(collection, list => (prepend ? [{ id, ...payload }, ...list] : [...list, { id, ...payload }]));
        return id;
    }
    try {
        const { fs, db } = await getFirestore();
        const ref = await fs.addDoc(fs.collection(db, collection), payload);
        return ref.id;
    } catch (err) {
        firebaseError(`crear en ${collection}`, err);
    }
}

export async function setDocument(collection, id, data, { merge = false } = {}) {
    const payload = clean(data);
    if (USE_MOCK) {
        setMock(collection, list => {
            const exists = list.some(d => d.id === id);
            if (!exists) return [...list, { id, ...payload }];
            return list.map(d => (d.id === id ? (merge ? { ...d, ...payload } : { id, ...payload }) : d));
        });
        return id;
    }
    try {
        const { fs, db } = await getFirestore();
        await fs.setDoc(fs.doc(db, collection, id), payload, { merge });
        return id;
    } catch (err) {
        firebaseError(`guardar en ${collection}`, err);
    }
}

export async function updateDocument(collection, id, data) {
    const payload = clean(data);
    if (USE_MOCK) {
        setMock(collection, list => list.map(d => (d.id === id ? { ...d, ...payload } : d)));
        return;
    }
    try {
        const { fs, db } = await getFirestore();
        await fs.updateDoc(fs.doc(db, collection, id), payload);
    } catch (err) {
        firebaseError(`actualizar en ${collection}`, err);
    }
}

export async function deleteDocument(collection, id) {
    if (USE_MOCK) {
        setMock(collection, list => list.filter(d => d.id !== id));
        return;
    }
    try {
        const { fs, db } = await getFirestore();
        await fs.deleteDoc(fs.doc(db, collection, id));
    } catch (err) {
        firebaseError(`eliminar en ${collection}`, err);
    }
}

/** Lee un documento de la lista mock (solo modo demo). */
export const findMock = (collection, id) => getMock(collection).find(d => d.id === id);
