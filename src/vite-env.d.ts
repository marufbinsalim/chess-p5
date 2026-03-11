/// <reference types="vite/client" />

// Type declarations for non-TS/JS assets
declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.mp3' {
  const value: string;
  export default value;
}

declare module '*.wav' {
  const value: string;
  export default value;
}

declare module '*.ogg' {
  const value: string;
  export default value;
}
