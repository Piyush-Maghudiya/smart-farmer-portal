/**
 * Helper to identify if a URL is a video.
 * Checks for common video extensions or Cloudinary's video upload path pattern.
 */
export const isVideoUrl = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.3gp', '.ogg'];
    const isVideoExt = videoExtensions.some(ext => {
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith(ext) || lowerUrl.includes(ext + "?") || lowerUrl.includes(ext + "#");
    });
    const isCloudinaryVideo = url.includes('/video/upload/');
    return isVideoExt || isCloudinaryVideo;
};
