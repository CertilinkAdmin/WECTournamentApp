/**
 * Photo Album Configuration
 * WEC25 Milano Championship Photos
 * 
 * To use OneDrive images:
 * 1. Open each image in OneDrive
 * 2. Click "..." menu -> "Embed"
 * 3. Or right-click -> "Get link" -> "Anyone with link can view"
 * 4. Extract the direct image URL
 * 
 * OneDrive Direct Link Format:
 * https://onedrive.live.com/download?resid=XXXXXX&authkey=XXXXXX
 * 
 * Alternative: Place images in client/public/images/ and reference as:
 * "/images/photo1.jpg"
 */

export const wecPhotoAlbum: string[] = [
  // Local WEC images from client/public/images/
  '/images/wec.png',
  '/images/wec3.png',
  '/images/wec4.png',
  '/images/MJ106371 copy.jpg',
  '/images/MJ106438 copy.jpg',
  '/images/MJ106534 copy.jpg',
  '/images/MJ106643 copy.jpg',
];

/**
 * Instructions to use your OneDrive photos:
 * 
 * Method 1: Get Direct Download Links
 * ===================================
 * For each photo in your OneDrive folder:
 * 1. Right-click the image
 * 2. Select "Embed"
 * 3. Copy the embed iframe src URL
 * 4. Replace the placeholder URLs above
 * 
 * Method 2: Use Share Links (requires conversion)
 * ==============================================
 * 1. Right-click image -> "Share" -> "Anyone with link can view"
 * 2. Copy the share link
 * 3. Convert to direct download link format:
 *    From: https://1drv.ms/i/s!XXXXX
 *    To: https://onedrive.live.com/download?resid=XXXXX&authkey=XXXXX
 * 
 * Method 3: Download and Host Locally
 * ====================================
 * 1. Download all 22 images from your OneDrive folder
 * 2. Place them in: client/public/images/wec25/
 * 3. Update this array with local paths:
 *    '/images/wec25/MJ106354.jpg',
 *    '/images/wec25/MJ106358.jpg',
 *    etc.
 */

export const carouselSettings = {
  autoPlayInterval: 6000, // 6 seconds per image
  showControls: true,     // Show navigation arrows and dots
  kenBurnsEffect: true,   // Subtle zoom animation
};
