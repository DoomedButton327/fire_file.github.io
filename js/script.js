// script.js

const platformSelect = document.getElementById('platformSelect');
const fileUpload = document.getElementById('fileUpload');
const colorPicker = document.getElementById('colorPicker');
const previewCanvas = document.getElementById('previewCanvas');
const downloadButton = document.getElementById('downloadButton');

// Example sizes for Discord, Twitch, Telegram
const sizes = {
    discord: { width: 128, height: 128 },
    twitch: { width: 112, height: 112 },
    telegram: { width: 512, height: 512 }
};

fileUpload.addEventListener('change', handleFileUpload);
platformSelect.addEventListener('change', updatePreview);
colorPicker.addEventListener('input', updatePreview);
downloadButton.addEventListener('click', downloadImage);

let uploadedImage;
let isGif = false;

function handleFileUpload() {
    const file = fileUpload.files[0];
    const reader = new FileReader();

    if (file.type === 'image/gif') {
        // Handle GIF file
        isGif = true;
        reader.onload = (event) => {
            const gif = new Image();
            gif.src = event.target.result;
            gif.onload = () => {
                uploadedImage = gif;
                updatePreview();
            };
        };
    } else {
        isGif = false;
        reader.onload = (event) => {
            uploadedImage = new Image();
            uploadedImage.onload = () => {
                updatePreview();
            };
            uploadedImage.src = event.target.result;
        };
    }

    if (file) {
        reader.readAsDataURL(file);
    }
}

function updatePreview() {
    if (!uploadedImage) return;

    const ctx = previewCanvas.getContext('2d');
    const platform = platformSelect.value;
    const { width, height } = sizes[platform];
    previewCanvas.width = width;
    previewCanvas.height = height;

    const fireBackImg = new Image();
    const fireFrontImg = new Image();

    fireBackImg.src = `assets/${platform}_back.gif`;
    fireFrontImg.src = `assets/${platform}_front.gif`;

    fireBackImg.onload = () => {
        // Draw background fire
        ctx.drawImage(fireBackImg, 0, 0, width, height);

        if (isGif) {
            // Handle GIF rendering with animation
            renderGif(uploadedImage, ctx, width, height, fireFrontImg);
        } else {
            // Draw uploaded image in the middle for static images
            drawMiddleImage(ctx, uploadedImage, width, height);

            // Draw colored flames
            fireFrontImg.onload = () => {
                applyFlameColor(ctx, fireFrontImg, width, height);
            };
        }
    };
}

function drawMiddleImage(ctx, image, width, height) {
    const imgAspectRatio = image.width / image.height;
    const canvasAspectRatio = width / height;
    let drawWidth, drawHeight;
    if (imgAspectRatio > canvasAspectRatio) {
        drawWidth = width;
        drawHeight = width / imgAspectRatio;
    } else {
        drawHeight = height;
        drawWidth = height * imgAspectRatio;
    }
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function applyFlameColor(ctx, flameImg, width, height) {
    // Create a temporary canvas to recolor the flame
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = flameImg.width;
    tempCanvas.height = flameImg.height;

    tempCtx.drawImage(flameImg, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    const flameColor = hexToRgb(colorPicker.value);
    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
            data[i] = flameColor.r; // Red
            data[i + 1] = flameColor.g; // Green
            data[i + 2] = flameColor.b; // Blue
        }
    }
    tempCtx.putImageData(imageData, 0, 0);

    // Draw the colored flames on the main canvas
    ctx.drawImage(tempCanvas, 0, 0, width, height);

    // Now draw the uncolored flames on top as a second layer to ensure they appear correctly
    ctx.drawImage(flameImg, 0, 0, width, height);
}

function renderGif(gif, ctx, width, height, fireFrontImg) {
    // Initialize gif.js with frame delays and quality settings
    const gifCreator = new GIF({
        workers: 2,
        quality: 10
    });

    // Example using one frame to show the concept (real GIFs need more handling)
    gifCreator.addFrame(ctx, {
        copy: true,
        delay: 100
    });

    // Generate GIF
    gifCreator.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        const animatedGif = new Image();
        animatedGif.src = url;

        animatedGif.onload = () => {
            // Draw the gif in the middle
            drawMiddleImage(ctx, animatedGif, width, height);

            // Draw the flame color on top
            applyFlameColor(ctx, fireFrontImg, width, height);
        };
    });

    gifCreator.render();
}

function downloadImage() {
    previewCanvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'fire_emote.png';
        link.click();
        URL.revokeObjectURL(link.href);
    });
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}
