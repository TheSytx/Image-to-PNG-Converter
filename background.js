/**
 * Image to PNG Converter
 * A Firefox extension to convert any image format to PNG when right-clicking
 *
 * Author: TheSytx
 */

// Create the context menu item
browser.contextMenus.create({
  id: "image-to-png",
  title: "Download as PNG",
  contexts: ["image"]
});

// Add listener for the context menu click
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "image-to-png") {
    convertAndDownload(info.srcUrl);
  }
});

// Function to convert any image to PNG and download
function convertAndDownload(imageUrl) {
  fetch(imageUrl)
    .then(response => response.blob())
    .then(blob => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Store the blob URL so we can revoke it after the image loads
      const blobUrl = URL.createObjectURL(blob);

      img.onload = function () {
        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);

        // The blob URL is no longer needed once the image has loaded
        URL.revokeObjectURL(blobUrl);

        // Convert canvas content to PNG blob
        canvas.toBlob(function (pngBlob) {
          const url = URL.createObjectURL(pngBlob);

          // Get the original filename and change extension to .png
          let filename = imageUrl.split('/').pop().split('?')[0];
          filename = filename.replace(/\.[^/.]+$/, '') + '.png';

          // Trigger the download and prompt for save location
          browser.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
          }).then((downloadId) => {
            // Wait for the download to finish before revoking the blob URL
            browser.downloads.onChanged.addListener(function cleanup(delta) {
              if (delta.id === downloadId && delta.state) {
                if (delta.state.current === "complete" || delta.state.current === "interrupted") {
                  URL.revokeObjectURL(url);
                  browser.downloads.onChanged.removeListener(cleanup);
                }
              }
            });
          });
        }, 'image/png');
      };

      img.onerror = function () {
        // Clean up if the image fails to load
        URL.revokeObjectURL(blobUrl);
        console.error("Failed to load image:", imageUrl);
      };

      img.src = blobUrl;
    })
    .catch(error => {
      console.error("Conversion error:", error);
    });
}