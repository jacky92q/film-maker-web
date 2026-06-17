// Saving a generated file reliably across desktop and mobile.
//
// On mobile Chrome / installed PWAs a programmatic <a download> often does
// nothing, so we prefer the Web Share API with a File (which opens the native
// "Save to Files / Photos / share" sheet). We fall back to an anchor download,
// then to opening the blob in a new tab.

export function canShareFile(file: File): boolean {
  return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [file] });
}

export function isMobile(): boolean {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function anchorDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Must be called from within a user gesture for the share sheet to appear.
export async function saveFile(blob: Blob, filename: string, title?: string): Promise<'shared' | 'downloaded' | 'opened'> {
  const file = new File([blob], filename, { type: blob.type });
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title: title ?? filename });
      return 'shared';
    } catch (e) {
      // user cancelled or share failed — fall through to download
      if ((e as DOMException)?.name === 'AbortError') return 'shared';
    }
  }
  try {
    anchorDownload(blob, filename);
    return 'downloaded';
  } catch {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    return 'opened';
  }
}
