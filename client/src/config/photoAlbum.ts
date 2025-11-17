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
  // Example OneDrive direct links (replace with actual URLs)
  // 'https://onedrive.live.com/download?resid=C6270C9A1A05AA6B%21s...',
  
  // Temporary placeholder images - replace with actual OneDrive URLs
  // or local images in /public/images/
  'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1920&q=80', // Coffee competition
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80', // Barista pouring
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1920&q=80', // Coffee art
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80', // Coffee shop
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1920&q=80', // Espresso machine
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
