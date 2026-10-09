import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    watch: {
      ignored: ['**/*.mp4', '**/*.zip', '**/*.png', '**/*.jpg', '**/*.glb']
    }
  }
});
