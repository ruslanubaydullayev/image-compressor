<template>
  <div class="compressor-container">

    <!-- Upload Area with fade -->
    <transition name="fade-up">
      <div
        v-if="!uploadedFile"
        class="upload-area"
        :class="{ dragging: isDragging }"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="file-input"
          @change="handleFileSelect"
        />

        <div class="upload-icon-wrapper">
          <svg
            class="upload-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <h2 class="upload-title">
          Drop your image here or click to browse
        </h2>
        <p class="upload-subtitle">
          Supports JPG, PNG, WebP, and more
        </p>

        <button
          @click="fileInput?.click()"
          class="upload-button"
        >
          Choose Image
        </button>
      </div>
    </transition>

    <!-- Processing State -->
    <transition name="fade-up">
      <div v-if="processing" class="processing-container">
        <div class="processing-visual">
          <div class="pulse-ring"></div>
          <div class="pulse-ring delay-1"></div>
          <div class="pulse-ring delay-2"></div>
          <div class="spinner-center">
            <svg class="compress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <p class="processing-text">{{ loadingMessage }}</p>

        <div class="loading-bar-track">
          <div class="loading-bar-fill" :style="{ width: fakeProgress + '%' }"></div>
        </div>
        <p class="loading-percent">{{ fakeProgress }}%</p>
      </div>
    </transition>

    <!-- Results -->
    <transition name="fade-up">
      <div v-if="showResults" class="results-container">
        <div class="results-card">
          <div class="results-header">
            <div class="success-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="results-title">Compression Complete</h2>
          </div>

          <div class="images-grid">
            <div class="image-section slide-in-left">
              <h3 class="image-section-title">Original</h3>
              <div class="image-wrapper">
                <img :src="originalImageUrl" :alt="originalFile?.name" />
              </div>
              <div class="image-info">
                <p><strong>Size:</strong> {{ formatFileSize(originalFile?.size || 0) }}</p>
                <p><strong>Dimensions:</strong> {{ originalDimensions }}</p>
              </div>
            </div>

            <div class="image-section slide-in-right">
              <h3 class="image-section-title">Compressed</h3>
              <div class="image-wrapper compressed">
                <img :src="compressedImageUrl" alt="Compressed" />
              </div>
              <div class="image-info">
                <p><strong>Size:</strong> {{ formatFileSize(compressedSize) }}</p>
                <p><strong>Dimensions:</strong> {{ originalDimensions }}</p>
                <p class="saved-info">
                  <strong>Saved:</strong> {{ displayedPercentage }}% ({{ formatFileSize(savedBytes) }})
                </p>
              </div>
            </div>
          </div>

          <div class="stats-container">
            <div class="stats-header">
              <span class="stats-label">Compression Ratio</span>
              <span class="stats-value" :style="{ color: ratioColor }">{{ displayedPercentage }}%</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: displayedPercentage + '%', background: ratioGradient }"
              ></div>
            </div>
            <div class="ratio-labels">
              <span>0%</span>
              <span :style="{ color: ratioColor, fontWeight: 600 }">{{ ratioLabel }}</span>
              <span>100%</span>
            </div>
          </div>

          <div class="actions-container">
            <button @click="downloadCompressed" class="action-button primary">
              Download Compressed Image
            </button>
            <button @click="reset" class="action-button secondary">
              Compress Another
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import imageCompression from 'browser-image-compression'

const fileInput = ref(null)
const uploadedFile = ref(null)
const originalFile = ref(null)
const originalImageUrl = ref('')
const compressedFile = ref(null)
const compressedImageUrl = ref('')
const compressedSize = ref(0)
const processing = ref(false)
const isDragging = ref(false)
const originalDimensions = ref('')
const showResults = ref(false)

const fakeProgress = ref(0)
const loadingMessage = ref('Analyzing image...')
const displayedPercentage = ref(0)

let progressInterval = null

const MINIMUM_LOADING_MS = 2800

const ratioColor = computed(() => {
  const p = displayedPercentage.value
  if (p < 20) return '#ef4444'
  if (p < 40) return '#f97316'
  if (p < 60) return '#eab308'
  if (p < 75) return '#84cc16'
  return '#22c55e'
})

const ratioGradient = computed(() => {
  const p = displayedPercentage.value
  if (p < 20) return 'linear-gradient(90deg, #fca5a5, #ef4444)'
  if (p < 40) return 'linear-gradient(90deg, #ef4444, #f97316)'
  if (p < 60) return 'linear-gradient(90deg, #f97316, #eab308)'
  if (p < 75) return 'linear-gradient(90deg, #eab308, #84cc16)'
  return 'linear-gradient(90deg, #84cc16, #22c55e)'
})

const ratioLabel = computed(() => {
  const p = displayedPercentage.value
  if (p < 20) return 'Low'
  if (p < 40) return 'Fair'
  if (p < 60) return 'Good'
  if (p < 75) return 'Great'
  return 'Excellent'
})

const compressionPercentage = computed(() => {
  if (!originalFile.value || !compressedSize.value) return 0
  const saved = ((originalFile.value.size - compressedSize.value) / originalFile.value.size) * 100
  return Math.round(saved)
})

const savedBytes = computed(() => {
  if (!originalFile.value || !compressedSize.value) return 0
  return originalFile.value.size - compressedSize.value
})

const loadingMessages = [
  { at: 0, text: 'Analyzing image...' },
  { at: 15, text: 'Detecting optimal format...' },
  { at: 35, text: 'Compressing pixels...' },
  { at: 55, text: 'Optimizing quality...' },
  { at: 75, text: 'Removing metadata...' },
  { at: 90, text: 'Almost done...' },
]

function startFakeProgress() {
  fakeProgress.value = 0
  loadingMessage.value = loadingMessages[0].text

  progressInterval = setInterval(() => {
    if (fakeProgress.value < 90) {
      const jump = Math.random() * 3 + 0.5
      fakeProgress.value = Math.min(90, Math.round(fakeProgress.value + jump))

      for (let i = loadingMessages.length - 1; i >= 0; i--) {
        if (fakeProgress.value >= loadingMessages[i].at) {
          loadingMessage.value = loadingMessages[i].text
          break
        }
      }
    }
  }, 80)
}

function finishProgress() {
  return new Promise((resolve) => {
    clearInterval(progressInterval)
    loadingMessage.value = 'Finalizing...'

    const finish = setInterval(() => {
      fakeProgress.value = Math.min(100, fakeProgress.value + 2)
      if (fakeProgress.value >= 100) {
        clearInterval(finish)
        resolve()
      }
    }, 20)
  })
}

function animatePercentage(target) {
  displayedPercentage.value = 0
  let current = 0
  const step = Math.max(1, Math.round(target / 40))
  const interval = setInterval(() => {
    current += step
    if (current >= target) {
      displayedPercentage.value = target
      clearInterval(interval)
    } else {
      displayedPercentage.value = current
    }
  }, 30)
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

const processFile = async (file) => {
  originalFile.value = file
  uploadedFile.value = file
  showResults.value = false

  originalImageUrl.value = URL.createObjectURL(file)

  const img = new Image()
  img.onload = () => {
    originalDimensions.value = `${img.width} × ${img.height}`
  }
  img.src = originalImageUrl.value

  processing.value = true
  startFakeProgress()

  const startTime = Date.now()

  try {
    const options = {
      maxSizeMB: file.size / (1024 * 1024) * 0.6,
      maxWidthOrHeight: 4096,
      useWebWorker: true,
      initialQuality: 0.85,
      preserveExif: false,
    }

    const result = await imageCompression(file, options)

    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, MINIMUM_LOADING_MS - elapsed)
    await new Promise(r => setTimeout(r, remaining))
    await finishProgress()

    await new Promise(r => setTimeout(r, 400))

    compressedFile.value = result
    compressedImageUrl.value = URL.createObjectURL(result)
    compressedSize.value = result.size
    processing.value = false

    await new Promise(r => setTimeout(r, 100))
    showResults.value = true

    await new Promise(r => setTimeout(r, 300))
    animatePercentage(compressionPercentage.value)

  } catch (error) {
    clearInterval(progressInterval)
    console.error('Compression error:', error)
    alert('Failed to compress image. Please try again.')
    processing.value = false
    reset()
  }
}

const downloadCompressed = () => {
  if (!compressedFile.value) return

  const link = document.createElement('a')
  link.href = compressedImageUrl.value

  const originalName = originalFile.value.name
  const ext = originalName.lastIndexOf('.')
  const baseName = ext > 0 ? originalName.substring(0, ext) : originalName
  link.download = `${baseName}-compressed.jpg`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const reset = () => {
  showResults.value = false

  setTimeout(() => {
    if (originalImageUrl.value) {
      URL.revokeObjectURL(originalImageUrl.value)
    }
    if (compressedImageUrl.value) {
      URL.revokeObjectURL(compressedImageUrl.value)
    }
    uploadedFile.value = null
    originalFile.value = null
    originalImageUrl.value = ''
    compressedFile.value = null
    compressedImageUrl.value = ''
    compressedSize.value = 0
    originalDimensions.value = ''
    displayedPercentage.value = 0
    fakeProgress.value = 0
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }, 400)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

onBeforeUnmount(() => {
  clearInterval(progressInterval)
  if (originalImageUrl.value) URL.revokeObjectURL(originalImageUrl.value)
  if (compressedImageUrl.value) URL.revokeObjectURL(compressedImageUrl.value)
})
</script>

<style scoped>
.upload-icon-wrapper {
  margin-bottom: 1.5rem;
}

/* Transitions */
.fade-up-enter-active {
  animation: fadeSlideUp 0.5s ease forwards;
}
.fade-up-leave-active {
  animation: fadeSlideDown 0.35s ease forwards;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeSlideDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* Processing Visual */
.processing-visual {
  position: relative;
  width: 8rem;
  height: 8rem;
  margin: 0 auto 2rem;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #a5b4fc;
  animation: pulseRing 2s ease-out infinite;
}
.pulse-ring.delay-1 { animation-delay: 0.6s; }
.pulse-ring.delay-2 { animation-delay: 1.2s; }

@keyframes pulseRing {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.spinner-center {
  position: absolute;
  inset: 1rem;
  background: #eef2ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: gentleSpin 4s linear infinite;
}

.compress-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #4f46e5;
}

@keyframes gentleSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Loading Bar */
.loading-bar-track {
  width: 60%;
  max-width: 20rem;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 9999px;
  margin: 1.5rem auto 0.75rem;
  overflow: hidden;
}

.loading-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #818cf8, #4f46e5);
  border-radius: 9999px;
  transition: width 0.15s ease;
}

.loading-percent {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6366f1;
  text-align: center;
}

/* Results Animations */
.results-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.success-badge {
  width: 2.5rem;
  height: 2.5rem;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.success-badge svg {
  width: 1.25rem;
  height: 1.25rem;
  color: #16a34a;
}

@keyframes popIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.slide-in-left {
  animation: slideLeft 0.6s ease 0.2s both;
}
.slide-in-right {
  animation: slideRight 0.6s ease 0.35s both;
}

@keyframes slideLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
