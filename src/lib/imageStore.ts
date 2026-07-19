import { get, set, del } from "idb-keyval";

const STORE_PREFIX = "img_";

function makeKey(url: string): string {
  return STORE_PREFIX + url;
}

export async function storeImageBlob(url: string, blob: Blob): Promise<void> {
  try {
    await set(makeKey(url), blob);
  } catch (e) {
    console.warn("Failed to store image blob in IndexedDB", e);
  }
}

export async function getImageBlob(url: string): Promise<Blob | null> {
  try {
    const blob = await get<Blob>(makeKey(url));
    return blob ?? null;
  } catch {
    return null;
  }
}

export async function removeImageBlob(url: string): Promise<void> {
  try {
    await del(makeKey(url));
  } catch {}
}

export async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function storeImageFromFile(url: string, file: File): Promise<void> {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  await storeImageBlob(url, blob);
}

export async function getImageDataURL(url: string): Promise<string | null> {
  const blob = await getImageBlob(url);
  if (!blob) return null;
  return blobToDataURL(blob);
}
