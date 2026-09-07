import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite'

const config: UserConfig = {
  base: './',
  plugins: [react()]
}

export default config
