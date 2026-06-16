// Vite injects the configured base ("/film-maker-web/") here.
export const BASE_URL = import.meta.env.BASE_URL;

export const asset = (path: string): string => `${BASE_URL}${path.replace(/^\//, '')}`;
