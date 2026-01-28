# Responsive Image Generator

A Next.js application that automatically generates optimized images in multiple sizes for responsive web design. Upload an image and get all the sizes you need for `srcset` attributes, along with the complete srcset code ready to use.

## Features

- 📤 **Easy Upload**: Drag and drop or click to upload images
- 🎯 **Smart Sizing**: Automatically generates common responsive breakpoints (320w, 480w, 640w, 768w, 1024w, 1366w, 1536w, 1920w)
- 🔍 **Aspect Ratio Preserved**: All generated images maintain the original aspect ratio
- 📋 **Copy Srcset**: One-click copy of the complete srcset attribute
- ⬇️ **Download All**: Download all generated images individually or all at once
- ⚡ **Fast Processing**: Server-side image processing with Sharp
- 🎨 **Clean UI**: Simple, modern interface with no external CSS frameworks

## Generated Image Sizes

The app generates images in the following widths (when the original image is large enough):

- 320px - Mobile (small)
- 480px - Mobile (medium)
- 640px - Mobile (large) / Tablet (small)
- 768px - Tablet (medium)
- 1024px - Tablet (large) / Desktop (small)
- 1366px - Desktop (medium)
- 1536px - Desktop (large)
- 1920px - Desktop (full HD)

Only sizes smaller than or equal to the original image width are generated to prevent upscaling.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
npm start
```

## How to Use

1. **Upload an Image**: Click the upload area or drag and drop an image file
2. **Wait for Processing**: The app will automatically generate all responsive sizes
3. **View Results**: See all generated images with their dimensions and file sizes
4. **Copy Srcset**: Click "Copy to Clipboard" to get the srcset attribute code
5. **Download Images**: Download individual images or all at once

## Example Srcset Output

```html
srcset="
  image-320x240.jpg 320w,
  image-480x360.jpg 480w,
  image-640x480.jpg 640w,
  image-768x576.jpg 768w,
  image-1024x768.jpg 1024w,
  image-1366x1025.jpg 1366w,
  image-1536x1152.jpg 1536w,
  image-1920x1440.jpg 1920w
"
sizes="(max-width: 1920px) 100vw, 1920px"
```

## Project Structure

```
src/
├── app/
│   ├── actions.js              # Server action for image processing
│   ├── page.js                 # Main page component
│   ├── layout.js              # Root layout
│   ├── globals.css            # Global styles
│   └── components/
│       ├── ImageUploader.js   # Upload and preview component
│       └── ResultsDisplay.js  # Results grid and download component
```

## Technologies Used

- **Next.js 16** - React framework with App Router
- **Sharp** - High-performance image processing
- **React** - UI library
- **CSS-in-JS** - Styled JSX for component styling

## Configuration

### Customizing Image Widths

To change the generated image widths, edit the `RESPONSIVE_WIDTHS` array in `src/app/actions.js`:

```javascript
const RESPONSIVE_WIDTHS = [320, 480, 640, 768, 1024, 1366, 1536, 1920];
```

### Adjusting Image Quality

To change the JPEG quality, modify the `quality` parameter in `src/app/actions.js`:

```javascript
.jpeg({ quality: 85 })  // Change 85 to your desired quality (1-100)
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
