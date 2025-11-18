/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to prevent socket.io double connections in development
}

module.exports = nextConfig
