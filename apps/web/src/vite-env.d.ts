/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAP_PROVIDER?: string;
  readonly VITE_MAPTILER_API_KEY?: string;
  readonly VITE_CARTO_API_KEY?: string;
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
  readonly VITE_AI_PROVIDER?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_APP_TITLE?: string;
  readonly VITE_DEFAULT_DESTINATION_ID?: string;
  readonly VITE_DEFAULT_LNG?: string;
  readonly VITE_DEFAULT_LAT?: string;
  readonly VITE_DEFAULT_ZOOM?: string;
  readonly VITE_DEFAULT_PITCH?: string;
  readonly VITE_DEFAULT_BEARING?: string;
  readonly VITE_DEFAULT_QUALITY_TIER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
