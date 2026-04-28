import { db, doc, getDoc, setDoc, updateDoc, increment, collection, getDocs, query as fireQuery, where, addDoc, deleteDoc } from '../firebase-config.js';
import { appState } from './state.js';

// Fetch products.json (có cache)
let productsCache = null;
export async function fetchProducts() {
    if (productsCache) return productsCache;
    try {
        const res = await fetch('data/products.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid format');
        productsCache = data;
        appState.set('products', data);
        return data;
    } catch (e) {
        console.error('❌ fetchProducts:', e);
        appState.set('products', []);
        throw e;
    }
}

// Firebase Stats (an toàn)
export async function getProductStats(productId) {
    if (!db) return { views: 0, downloads: 0 };
    try {
        const ref = doc(db, 'stats', productId);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : { views: 0, downloads: 0 };
    } catch { return { views: 0, downloads: 0 }; }
}

export async function incrementView(productId) {
    if (!db) return;
    try { await updateDoc(doc(db, 'stats', productId), { views: increment(1) }); }
    catch { await setDoc(doc(db, 'stats', productId), { views: 1, downloads: 0 }).catch(() => {}); }
}

export async function incrementDownload(productId) {
    if (!db) return;
    try { await updateDoc(doc(db, 'stats', productId), { downloads: increment(1) }); }
    catch { await setDoc(doc(db, 'stats', productId), { views: 0, downloads: 1 }).catch(() => {}); }
}

export async function getGlobalStats() {
    if (!db) return { views: 0, downloads: 0 };
    try {
        const snap = await getDocs(collection(db, 'stats'));
        let views = 0, downloads = 0;
        snap.forEach(d => { views += d.data().views || 0; downloads += d.data().downloads || 0; });
        return { views, downloads };
    } catch { return { views: 0, downloads: 0 }; }
}

// Favorites
export async function isFavorite(productId, userId) {
    if (!db || !userId) return false;
    const q = fireQuery(collection(db, 'favorites'), where('userId', '==', userId), where('productId', '==', productId));
    return !(await getDocs(q)).empty;
}

export async function toggleFavorite(productId, userId, currentState) {
    if (!db || !userId) throw new Error('Chưa đăng nhập');
    const q = fireQuery(collection(db, 'favorites'), where('userId', '==', userId), where('productId', '==', productId));
    const snap = await getDocs(q);
    if (currentState) {
        snap.forEach(d => deleteDoc(d.ref));
        return false;
    } else {
        await addDoc(collection(db, 'favorites'), { userId, productId, favoritedAt: new Date() });
        return true;
    }
}
