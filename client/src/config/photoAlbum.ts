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
  // WEC25 Milano Championship Photos from OneDrive
  'https://southcentralus1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=193565&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!J83iF6K3jEaRyqXEwzWMfnzhcPr7B59Esx5tXTEUfXDdRZVPGReVR6tnQFmHiHge%2Fitems%2F01P5IYF4WR4BQV5Z3QEBEIII5UA4WUHAIC%3Ftempauth%3Dv1e.eyJzaXRlaWQiOiIxN2UyY2QyNy1iN2EyLTQ2OGMtOTFjYS1hNWM0YzMzNThjN2UiLCJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbXkubWljcm9zb2Z0cGVyc29uYWxjb250ZW50LmNvbUA5MTg4MDQwZC02YzY3LTRjNWItYjExMi0zNmEzMDRiNjZkYWQiLCJleHAiOiIxNzYzMzgwODAwIn0.RR29BpX7yIXQX069rQQHUSYpJgG55rtPO-Ct0H4yt5HFXBMQ5JNXnEYXtSPwUvGJ9NrAL7FnRaArv8mduDth_L166mg3JvsmzvWMKdZcX8d-YIW6K52B0hC3_6bOJO7TXAcDORfIfUo1kHL3FJgD1GPMRoWYpSq2jiDyY8BgoE8bgVkBmACLfqxhooBvO059WoUtymnfH-tSsvSik6Iadeyx9zrKNB-gjIVLVEn8Jm1zM_jqHGn1ozfdBZGA2PIk64-kTATpvqS-4DBleOJNtDh-HYgBGDPL4gZn5QXSRF71sHsGcg0k-mYbeT0EJsqZVfWSJlhddpOnPrjvu_Fb857B5aqOa2SvXnCkGGYuk1d8SwkoHgFxZ9pFiBC7us_F8hZhV-9T5Su5gVoZbwy5zClznGC0FJSZd0jjwmkTPDNm7lEeXvyHVgzuXymLGuPOT386gsZNYSSJ-D_LIgtjVG0P0R_dG9Lpibvu5k7XVkF43bCXaW3VS2pSD9rXq-6l.ChUbUcBuTBPYBOon8DPc1bcPk_cSqGp56pDHtrvslVM%26version%3DPublished&cb=63897397822&encodeFailures=1&width=1281&height=856',
  'https://southcentralus1-mediap.svc.ms/transform/thumbnail?provider=spo&farmid=193565&inputFormat=jpg&cs=fFNQTw&docid=https%3A%2F%2Fmy.microsoftpersonalcontent.com%2F_api%2Fv2.0%2Fdrives%2Fb!J83iF6K3jEaRyqXEwzWMfnzhcPr7B59Esx5tXTEUfXDdRZVPGReVR6tnQFmHiHge%2Fitems%2F01P5IYF4SZQS3QBLJ2YJGYW2FWC3IWLGCP%3Ftempauth%3Dv1e.eyJzaXRlaWQiOiIxN2UyY2QyNy1iN2EyLTQ2OGMtOTFjYS1hNWM0YzMzNThjN2UiLCJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbXkubWljcm9zb2Z0cGVyc29uYWxjb250ZW50LmNvbUA5MTg4MDQwZC02YzY3LTRjNWItYjExMi0zNmEzMDRiNjZkYWQiLCJleHAiOiIxNzYzMzgwODAwIn0.BQlXUzq9_hEAOMMrHh-ntpGIBM5HbtSZzR6pnJnmfNDplrAhYXYEbds99RDSgpRjzGNml-MJfanv6BwUmPsKnzq_LseAEYa2GV5qGebVEaCb3hPrM0_tt-HHryAIkh1OstL7wpZ3WAzLlklKumw_bdS8KOA0uoCd4PkyzcTi_ErOc9NHLh1bpbYrBIsMwBCRMgzN65T6RD1mF5XkN_S9wOoHdTHvEXmZtYlP_bO25NnkWxg8QMepDgNrk0gLu6Qmik51N7-z427DkEgb2dEvgSyC12F-oQwQcU_YWvy4M2I979IUZT8aCFJEwqXjGwCVSWOc2Rr03YzKyrkaQbmEWYzaGmB9va25ZJ-R-QkJw8I_z4tEdqMi_DdPHIBTt6ngM7Mv9FaDYgV1QeEpk4hcSM16sfRzV_5zHY0Q2M6Jqr4SiPBdxk83FY1HABFmFLRt7z7bwaS0VK3njA73JyOPrxIWJg8_RPXzxSKGnQMcVjWMEwP3Tvf28jWPzf5Ia39O.fZMWNlOPNQm8wyu5BvkdRTK3SQ204BIAKyH4gGPBpe0%26version%3DPublished&cb=63896858252&encodeFailures=1&width=571&height=856',
  
  // Coffee-themed placeholder images (keeping these - they look great!)
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
