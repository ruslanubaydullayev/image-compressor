# Nuxt 3 Image Compressor

A modern, fast image compression tool built with Nuxt 3. Compress your images without losing quality!

## Features

- 🖼️ Drag and drop image upload
- 📦 Smart compression using Sharp
- 📊 Real-time compression statistics
- 💾 Download compressed images
- 🎨 Beautiful, modern UI
- 📱 Fully responsive design

## Setup

Install dependencies:

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## How It Works

The app uses Sharp, a high-performance image processing library, to compress images while maintaining quality. It automatically:

- Converts images to optimal formats (WebP for PNG, optimized JPEG for photos)
- Applies intelligent compression settings
- Preserves image dimensions
- Maintains visual quality while reducing file size

## Tech Stack

- **Nuxt 3** - Vue.js framework
- **Sharp** - Image processing
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
