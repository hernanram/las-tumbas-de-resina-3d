import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/*.mp4', '**/*.zip', '**/*.png', '**/*.jpg', '**/*.glb']
    }
  }
});
