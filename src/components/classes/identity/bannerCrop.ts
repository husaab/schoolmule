// src/components/classes/identity/bannerCrop.ts
// A class banner upload: the picked image center-cropped on a canvas to
// 1200 x 300 and saved as a JPEG at quality 0.9, the size every banner slot
// is drawn for (the 4:1 tiles and the 3.2:1 header both crop from it).

import { cropImageFile } from '@/lib/imageCrop'

export const BANNER_WIDTH = 1200
export const BANNER_HEIGHT = 300

export const cropBanner = (file: Blob): Promise<Blob> =>
  cropImageFile(file, { width: BANNER_WIDTH, height: BANNER_HEIGHT, quality: 0.9 })
