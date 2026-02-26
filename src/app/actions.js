'use server';

import sharp from 'sharp';

// Common responsive image widths for srcset
const RESPONSIVE_WIDTHS = [320, 480, 640, 768, 1024, 1366, 1536, 1920];

// Named size presets mapping to preferred widths
const SIZE_LABELS = {
  'small-mobile': 320,
  'mobile': 480,
  'card': 640,
  'tablet': 768,
  'desktop': 1024,
  'large': 1536
};

export async function processImage(formData) {
  try {
    const file = formData.get('image');
    const format = formData.get('format') || 'jpg';
    
    if (!file) {
      return { error: 'No file provided' };
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get original image metadata
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    // Determine desired widths: support optional selectedSizes (comma separated labels)
    const selectedSizesRaw = formData.get('selectedSizes');
    let desiredWidths = [];

    if (selectedSizesRaw) {
      try {
        const labels = String(selectedSizesRaw).split(',').map(s => s.trim()).filter(Boolean);
        // Map labels to widths, preserving order and removing unknown labels
        desiredWidths = labels.map(l => SIZE_LABELS[l]).filter(Boolean);
      } catch (e) {
        desiredWidths = [];
      }
    }

    // If no specific selection, fall back to default responsive widths
    if (!desiredWidths || desiredWidths.length === 0) {
      desiredWidths = RESPONSIVE_WIDTHS.slice();
    }

    // Filter widths to only include those smaller than or equal to original
    let validWidths = desiredWidths.filter(width => width <= originalWidth);

    // Add original width if it's not in the list
    if (!validWidths.includes(originalWidth)) {
      validWidths.push(originalWidth);
      validWidths.sort((a, b) => a - b);
    }

    // Determine file extension based on format
    const extension = format === 'webp' ? 'webp' : format === 'png' ? 'png' : 'jpg';

    // Process each width
    const processedImages = await Promise.all(
      validWidths.map(async (width) => {
        // Calculate height maintaining aspect ratio
        const height = Math.round((originalHeight / originalWidth) * width);
        
        // Start with sharp buffer
        let sharpInstance = sharp(buffer)
          .resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
          });

        // Apply format-specific conversion
        if (format === 'webp') {
          sharpInstance = sharpInstance.webp({ quality: 85 });
        } else if (format === 'png') {
          sharpInstance = sharpInstance.png({ quality: 85, compressionLevel: 9 });
        } else {
          sharpInstance = sharpInstance.jpeg({ quality: 85 });
        }

        const resizedBuffer = await sharpInstance.toBuffer();

        // Convert to base64 for transfer
        const base64 = resizedBuffer.toString('base64');
        
        // Attempt to find a label matching this width
        const labelEntry = Object.entries(SIZE_LABELS).find(([, w]) => w === width);
        const label = labelEntry ? labelEntry[0] : String(width);

        return {
          width,
          height,
          data: base64,
          size: resizedBuffer.length,
          label
        };
      })
    );

    // Generate srcset string (without directory - will be added on client)
    const originalName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    
    // Generate sizes attribute based on original width
    const sizesAttr = `(max-width: ${originalWidth}px) 100vw, ${originalWidth}px`;

    return {
      success: true,
      images: processedImages,
      originalName,
      format: extension,
      sizesAttr,
      metadata: {
        originalWidth,
        originalHeight,
        format: metadata.format
      }
    };
  } catch (error) {
    console.error('Image processing error:', error);
    return { error: error.message };
  }
}
