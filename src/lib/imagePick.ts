import { putImageFile } from './imageStore';

// Opens the native file picker and stores the chosen image, returning a
// `web_img://` reference. Resolves to null if cancelled.
export function pickImage(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const path = await putImageFile(file);
      resolve(path);
    };
    // If the dialog is dismissed there is no reliable event; that's acceptable.
    input.click();
  });
}
