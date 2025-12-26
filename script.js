document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mobile Menu Toggle ---
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuToggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
        });

        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });
    }

    // --- Hero Animation (Floating Donuts/Shapes) ---
    const heroAnimation = document.getElementById('hero-animation');
    if (heroAnimation) {
        const shapes = ['🍩', '☁️', '⚡', '🛹'];
        const colors = ['#FFD90F', '#4CB5F5', '#FF90B3', '#FFF'];
        
        for (let i = 0; i < 15; i++) {
            const el = document.createElement('div');
            el.classList.add('float-shape');
            el.textContent = shapes[Math.floor(Math.random() * shapes.length)];
            
            // Random positioning
            el.style.left = Math.random() * 100 + '%';
            el.style.fontSize = (Math.random() * 30 + 20) + 'px';
            el.style.animationDuration = (Math.random() * 10 + 10) + 's'; // 10-20s
            el.style.animationDelay = (Math.random() * 5) + 's';
            
            heroAnimation.appendChild(el);
        }
    }

    // --- FAQ Accordion ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            
            // Close others
            document.querySelectorAll('.faq-item').forEach(i => {
                if (i !== item) {
                    i.classList.remove('active');
                    i.querySelector('.icon').textContent = '+';
                }
            });

            item.classList.toggle('active');
            const icon = btn.querySelector('.icon');
            icon.textContent = item.classList.contains('active') ? '−' : '+';
        });
    });

    // --- Modals ---
    const openButtons = document.querySelectorAll('[data-modal-target]');
    const closeButtons = document.querySelectorAll('[data-modal-close]');
    const modals = document.querySelectorAll('.modal');

    openButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(`${btn.dataset.modalTarget}-modal`);
            if (target) {
                target.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    });
    
    // --- Scroll Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(section);
    });

    // =========================================================================
    // 🔌 BACKEND WIRING START (Playground Functionality)
    // =========================================================================

    // DOM Elements
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const previewImage = document.getElementById('preview-image');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultPlaceholder = document.getElementById('result-placeholder');
    const loadingState = document.getElementById('loading-state');
    const resultFinal = document.getElementById('result-final');
    const downloadBtn = document.getElementById('download-btn');

    // Constants & Config
    const USER_ID = 'DObRu1vyStbUynoQmTcHBlhs55z2';
    const POLL_INTERVAL = 2000; 
    const MAX_POLLS = 60;
    
    // State
    let currentUploadedUrl = null;

    // --- UTILITY FUNCTIONS ---

    // Generate nanoid for unique filename
    function generateNanoId(length = 21) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // --- API FUNCTIONS ---

    // Upload file to CDN storage (called immediately when file is selected)
    async function uploadFile(file) {
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueId = generateNanoId();
        const fileName = 'media/' + uniqueId + '.' + fileExtension;
        
        // Step 1: Get signed URL from API
        const signedUrlResponse = await fetch(
            'https://core.faceswapper.ai/media/get-upload-url?fileName=' + encodeURIComponent(fileName) + '&projectId=dressr',
            { method: 'GET' }
        );
        
        if (!signedUrlResponse.ok) {
            throw new Error('Failed to get signed URL: ' + signedUrlResponse.statusText);
        }
        
        const signedUrl = await signedUrlResponse.text();
        
        // Step 2: PUT file to signed URL
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file: ' + uploadResponse.statusText);
        }
        
        // Step 3: Return download URL
        const downloadUrl = 'https://assets.dressr.ai/' + fileName;
        return downloadUrl;
    }

    // Submit generation job (Image or Video)
    async function submitImageGenJob(imageUrl) {
        const isVideo = 'image-effects' === 'video-effects';
        const endpoint = isVideo ? 'https://api.chromastudio.ai/video-gen' : 'https://api.chromastudio.ai/image-gen';
        
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0'
        };

        let body = {};
        if (isVideo) {
            body = {
                imageUrl: [imageUrl],
                effectId: 'simpsonsCharacter',
                userId: USER_ID,
                removeWatermark: true,
                model: 'video-effects',
                isPrivate: true
            };
        } else {
            body = {
                model: 'image-effects',
                toolType: 'image-effects',
                effectId: 'simpsonsCharacter',
                imageUrl: imageUrl,
                userId: USER_ID,
                removeWatermark: true,
                isPrivate: true
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit job: ' + response.statusText);
        }
        
        const data = await response.json();
        return data;
    }

    // Poll job status until completed or failed
    async function pollJobStatus(jobId) {
        const isVideo = 'image-effects' === 'video-effects';
        const baseUrl = isVideo ? 'https://api.chromastudio.ai/video-gen' : 'https://api.chromastudio.ai/image-gen';
        let polls = 0;
        
        while (polls < MAX_POLLS) {
            const response = await fetch(
                `${baseUrl}/${USER_ID}/${jobId}/status`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, */*'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to check status: ' + response.statusText);
            }
            
            const data = await response.json();
            
            if (data.status === 'completed') {
                return data;
            }
            
            if (data.status === 'failed' || data.status === 'error') {
                throw new Error(data.error || 'Job processing failed');
            }
            
            // Update UI with progress
            updateStatus('Processing... (' + (polls + 1) + ')');
            
            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            polls++;
        }
        
        throw new Error('Job timed out after ' + MAX_POLLS + ' polls');
    }

    // --- UI HELPER FUNCTIONS ---

    function showLoading() {
        if (loadingState) loadingState.classList.remove('hidden');
        if (resultPlaceholder) resultPlaceholder.classList.add('hidden');
        if (resultFinal) {
            resultFinal.classList.add('hidden');
            resultFinal.style.display = 'none'; // Ensure display none for clean switching
        }
        const vid = document.getElementById('result-video');
        if (vid) vid.style.display = 'none';
        
        if (generateBtn) generateBtn.disabled = true;
    }

    function hideLoading() {
        if (loadingState) loadingState.classList.add('hidden');
        if (generateBtn) generateBtn.disabled = false;
    }

    function updateStatus(text) {
        if (generateBtn) generateBtn.textContent = text;
    }

    function showError(msg) {
        console.error(msg);
        alert('Error: ' + msg);
        if (generateBtn) {
            generateBtn.textContent = 'Generate';
            generateBtn.disabled = false;
        }
    }

    function showPreview(url) {
        if (previewImage) {
            previewImage.src = url;
            previewImage.classList.remove('hidden');
        }
        if (uploadPlaceholder) uploadPlaceholder.classList.add('hidden');
        if (resetBtn) resetBtn.classList.remove('hidden');
    }

    // UI Helper: Show result media (Image or Video)
    function showResultMedia(url) {
        const container = resultFinal ? resultFinal.parentElement : document.querySelector('.result-area');
        if (!container) return;
        
        const isVideo = url.toLowerCase().match(/\.(mp4|webm)(\?.*)?$/i);
        
        if (isVideo) {
            // Hide image
            if (resultFinal) resultFinal.style.display = 'none';
            
            // Show/Create video
            let video = document.getElementById('result-video');
            if (!video) {
                video = document.createElement('video');
                video.id = 'result-video';
                video.controls = true;
                video.autoplay = true;
                video.loop = true;
                video.className = resultFinal ? resultFinal.className : 'w-full h-auto rounded-lg';
                video.style.maxWidth = '100%';
                container.appendChild(video);
            }
            video.src = url;
            video.style.display = 'block';
            video.classList.remove('hidden');
        } else {
            // Hide video
            const video = document.getElementById('result-video');
            if (video) video.style.display = 'none';
            
            // Show image
            if (resultFinal) {
                resultFinal.style.display = 'block';
                resultFinal.classList.remove('hidden');
                resultFinal.crossOrigin = 'anonymous';
                resultFinal.src = url;
            }
        }
    }

    // UI Helper: Store download URL on button
    function showDownloadButton(url) {
        if (downloadBtn) {
            downloadBtn.dataset.url = url;
            downloadBtn.style.display = 'inline-block';
            downloadBtn.classList.remove('hidden');
        }
    }

    // Enable generate button after upload is complete
    function enableGenerateButton() {
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate';
        }
    }

    // --- EVENT HANDLERS ---

    // Handler when file is selected - uploads immediately
    async function handleFileSelect(file) {
        try {
            // Show local preview immediately for better UX
            const reader = new FileReader();
            reader.onload = (e) => showPreview(e.target.result);
            reader.readAsDataURL(file);

            updateStatus('Uploading...');
            if (generateBtn) generateBtn.disabled = true;
            
            // Upload immediately
            const uploadedUrl = await uploadFile(file);
            currentUploadedUrl = uploadedUrl;
            
            // Update preview to use remote URL (optional, ensures consistency)
            // showPreview(uploadedUrl); 
            
            updateStatus('Ready to Generate');
            enableGenerateButton();
            
        } catch (error) {
            updateStatus('Upload Failed');
            showError(error.message);
        }
    }

    // Handler when Generate button is clicked - submits job and polls for result
    async function handleGenerate() {
        if (!currentUploadedUrl) {
            alert('Please upload an image first.');
            return;
        }
        
        try {
            showLoading();
            updateStatus('Submitting...');
            
            // Step 1: Submit job to ChromaStudio API
            const jobData = await submitImageGenJob(currentUploadedUrl);
            
            updateStatus('Queued...');
            
            // Step 2: Poll for completion
            const result = await pollJobStatus(jobData.jobId);
            
            // Step 3: Extract result URL
            const resultItem = Array.isArray(result.result) ? result.result[0] : result.result;
            const resultUrl = resultItem?.mediaUrl || resultItem?.video || resultItem?.image;
            
            if (!resultUrl) {
                throw new Error('No image URL in response');
            }
            
            // Step 4: Display result
            showResultMedia(resultUrl);
            
            updateStatus('Generate Again');
            hideLoading();
            showDownloadButton(resultUrl);
            
        } catch (error) {
            hideLoading();
            updateStatus('Error');
            showError(error.message);
        }
    }

    // --- DOM WIRING ---

    if (uploadZone && fileInput) {
        // Click to upload
        uploadZone.addEventListener('click', () => fileInput.click());
        
        // Drag & Drop visual feedback
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--primary)';
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = '#ccc';
        });
        
        // Drop Handler
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#ccc';
            const file = e.dataTransfer.files[0];
            if (file) {
                handleFileSelect(file);
            }
        });

        // File Input Change Handler
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileSelect(file);
            }
        });
    }

    // GENERATE BUTTON
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
    }

    // RESET BUTTON
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentUploadedUrl = null;
            if (previewImage) {
                previewImage.src = '';
                previewImage.classList.add('hidden');
            }
            if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');
            if (fileInput) fileInput.value = '';
            
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generate';
            }
            resetBtn.classList.add('hidden');
            
            // Reset Result side
            if (resultFinal) {
                resultFinal.classList.add('hidden');
                resultFinal.style.display = 'none';
            }
            const vid = document.getElementById('result-video');
            if (vid) vid.style.display = 'none';

            if (resultPlaceholder) resultPlaceholder.classList.remove('hidden');
            if (downloadBtn) downloadBtn.classList.add('hidden');
            if (loadingState) loadingState.classList.add('hidden');
        });
    }

    // DOWNLOAD BUTTON
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const url = downloadBtn.dataset.url;
            if (!url) return;
            
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Downloading...';
            downloadBtn.disabled = true;
            
            try {
                // FORCE download using fetch + blob
                const response = await fetch(url, {
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch file: ' + response.statusText);
                }
                
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                // Determine extension
                const contentType = response.headers.get('content-type') || '';
                let extension = 'jpg';
                if (contentType.includes('video') || url.match(/\.(mp4|webm)/i)) {
                    extension = 'mp4';
                } else if (contentType.includes('png') || url.match(/\.png/i)) {
                    extension = 'png';
                } else if (contentType.includes('webp') || url.match(/\.webp/i)) {
                    extension = 'webp';
                }
                
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'result_' + generateNanoId(8) + '.' + extension;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                
            } catch (err) {
                console.error('Download error:', err);
                
                // Fallback: Canvas for images
                try {
                    const img = document.getElementById('result-final');
                    if (img && img.style.display !== 'none' && img.complete && img.naturalWidth > 0) {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const link = document.createElement('a');
                                link.href = URL.createObjectURL(blob);
                                link.download = 'result_' + generateNanoId(8) + '.png';
                                link.click();
                                setTimeout(() => URL.revokeObjectURL(link.href), 1000);
                            } else {
                                alert('Download failed. Right-click the image and select "Save image as..." to download.');
                            }
                        }, 'image/png');
                        return;
                    }
                } catch (canvasErr) {
                    console.error('Canvas fallback error:', canvasErr);
                }
                
                // Final fallback
                alert('Direct download failed. The file will open in a new tab.\nRight-click and select "Save as..." to download.');
                window.open(url, '_blank');
            } finally {
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }
        });
    }
});