import { putImageFile } from './imageStore';

// Opens the native picker and stores the chosen image(s), returning
// `web_img://` references. Resolves empty if the dialog is dismissed.
function pick(multiple: boolean): Promise<string[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = multiple;
    input.onchange = async () => {
      const files = [...(input.files ?? [])];
      if (!files.length) return resolve([]);
      resolve(await Promise.all(files.map((f) => putImageFile(f))));
    };
    input.click();
  });
}

export async function pickImage(): Promise<string | null> {
  const [first] = await pick(false);
  return first ?? null;
}

export function pickImages(): Promise<string[]> {
  return pick(true);
}
