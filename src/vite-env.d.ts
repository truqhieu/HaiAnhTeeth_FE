/// <reference types="vite/client" />

declare module "vite/client" {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_API1_URL?: string;
  }
}
