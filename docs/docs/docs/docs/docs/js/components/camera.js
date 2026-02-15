// ===================================
// CAMERA CAPTURE COMPONENT
// ===================================

class CameraCapture {
    constructor(options = {}) {
        this.onCapture = options.onCapture || null;
        this.onError = options.onError || null;
        this.stream = null;
        this.videoElement = null;
        this.canvasElement = null;
    }

    // Start camera
    async startCamera(videoElement) {
        this.videoElement = videoElement;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            this.videoElement.srcObject = this.stream;
            this.videoElement.play();

            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            if (this.onError) {
                this.onError(error);
            }
            return false;
        }
    }

    // Stop camera
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    }

    // Capture photo
    capturePhoto() {
        if (!this.videoElement) {
            console.error('Video element not initialized');
            return null;
        }

        // Create canvas
        if (!this.canvasElement) {
            this.canvasElement = document.createElement('canvas');
        }

        const video = this.videoElement;
        this.canvasElement.width = video.videoWidth;
        this.canvasElement.height = video.videoHeight;

        // Draw video frame to canvas
        const context = this.canvasElement.getContext('2d');
        context.drawImage(video, 0, 0);

        // Get image data
        const imageData = this.canvasElement.toDataURL('image/jpeg', 0.9);

        // Stop camera
        this.stopCamera();

        // Call callback
        if (this.onCapture) {
            this.onCapture(imageData);
        }

        return imageData;
    }

    // Create camera UI
    createCameraUI(container) {
        container.innerHTML = `
      <div class="camera-container">
        <video id="camera-video" class="camera-video" autoplay playsinline></video>
        <div class="camera-controls">
          <button class="capture-btn" id="capture-btn" title="Capture Photo"></button>
          <button class="btn btn-danger btn-sm" id="cancel-camera-btn">Cancel</button>
        </div>
      </div>
    `;

        const videoElement = document.getElementById('camera-video');
        const captureBtn = document.getElementById('capture-btn');
        const cancelBtn = document.getElementById('cancel-camera-btn');

        // Start camera
        this.startCamera(videoElement);

        // Capture button
        captureBtn.addEventListener('click', () => {
            this.capturePhoto();
        });

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            this.stopCamera();
            if (this.onError) {
                this.onError(new Error('Camera cancelled'));
            }
        });
    }

    // Open camera in modal
    static openCameraModal(onCapture, onError) {
        const modal = new Modal({
            title: 'Capture Photo',
            size: 'large'
        });

        const camera = new CameraCapture({
            onCapture: (imageData) => {
                modal.close();
                if (onCapture) onCapture(imageData);
            },
            onError: (error) => {
                modal.close();
                if (onError) onError(error);
            }
        });

        const modalEl = modal.open();
        const bodyEl = modalEl.querySelector('.modal-body');
        camera.createCameraUI(bodyEl);

        return { modal, camera };
    }

    // File upload helper
    static openFileUpload(onSelect, accept = 'image/*') {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;

            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const imageData = event.target.result;
                        if (onSelect) onSelect(imageData);
                        resolve(imageData);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                } else {
                    reject(new Error('No file selected'));
                }
            });

            input.click();
        });
    }
}

// Export to window
window.CameraCapture = CameraCapture;
