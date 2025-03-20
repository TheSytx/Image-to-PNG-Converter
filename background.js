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
  // Fetch the image
  fetch(imageUrl)
    .then(response => response.blob())
    .then(blob => {
      // Create image and canvas elements
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = function() {
        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert canvas content to PNG blob
        canvas.toBlob(function(pngBlob) {
          // Create a URL for the blob
          const url = URL.createObjectURL(pngBlob);
          
          // Get the original filename and change extension to .png
          let filename = imageUrl.split('/').pop().split('?')[0];
          filename = filename.replace(/\.[^/.]+$/, '') + '.png';
          
          // Trigger the download and prompt for save location
          browser.downloads.download({
            url: url,
            filename: filename,
            saveAs: true // Ask user where to save
          });
        }, 'image/png');
      };
      
      // Load the blob into the image element
      img.src = URL.createObjectURL(blob);
    })
    .catch(error => {
      console.error("Conversion error:", error);
    });
}