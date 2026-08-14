import { get, set, del } from "idb-keyval";
const STORE_PREFIX = "img_";
function makeKey(url) {
    return STORE_PREFIX + url;
}
export async function storeImageBlob(url, blob) {
    try {
        await set(makeKey(url), blob);
    }
    catch (e) {
        console.warn("Failed to store image blob in IndexedDB", e);
    }
}
export async function getImageBlob(url) {
    try {
        const blob = await get(makeKey(url));
        return blob ?? null;
    }
    catch {
        return null;
    }
}
export async function removeImageBlob(url) {
    try {
        await del(makeKey(url));
    }
    catch { }
}
export async function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
export async function storeImageFromFile(url, file) {
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    await storeImageBlob(url, blob);
}
export async function getImageDataURL(url) {
    const blob = await getImageBlob(url);
    if (!blob)
        return null;
    return blobToDataURL(blob);
}
