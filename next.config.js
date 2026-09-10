const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' só no build da imagem Docker (BUILD_STANDALONE=1);
  // localmente atrapalha `next start`.
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  reactStrictMode: true,
  // Fixa a raiz do rastreamento no diretório do projeto — há um
  // package-lock.json solto em ~/ que confunde a detecção de workspace.
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
