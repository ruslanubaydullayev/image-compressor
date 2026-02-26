<template>
  <div class="compressor-container">
    <!-- Upload Area -->
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

    <!-- Processing State -->
    <div v-if="processing" class="processing-container">
      <div class="spinner"></div>
      <p class="processing-text">Compressing your image...</p>
    </div>

    <!-- Results -->
    <div v-if="compressedImage && !processing" class="results-container">
      <div class="results-card">
        <h2 class="results-title">Compression Results</h2>
        
        <div class="images-grid">
          <!-- Original Image -->
          <div class="image-section">
            <h3 class="image-section-title">Original</h3>
            <div class="image-wrapper">
              <img
                :src="originalImageUrl"
                :alt="originalFile?.name"
              />
            </div>
            <div class="image-info">
              <p><strong>Size:</strong> {{ formatFileSize(originalFile?.size || 0) }}</p>
              <p><strong>Dimensions:</strong> {{ originalDimensions }}</p>
            </div>
          </div>

          <!-- Compressed Image -->
          <div class="image-section">
            <h3 class="image-section-title">Compressed</h3>
            <div class="image-wrapper compressed">
              <img
                :src="compressedImageUrl"
                alt="Compressed"
              />
            </div>
            <div class="image-info">
              <p><strong>Size:</strong> {{ formatFileSize(compressedSize) }}</p>
              <p><strong>Dimensions:</strong> {{ originalDimensions }}</p>
              <p class="saved-info">
                <strong>Saved:</strong> {{ compressionPercentage }}% ({{ formatFileSize(savedBytes) }})
              </p>
            </div>
          </div>
        </div>

        <!-- Compression Stats -->
        <div class="stats-container">
          <div class="stats-header">
            <span class="stats-label">Compression Ratio</span>
            <span class="stats-value">{{ compressionPercentage }}%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: compressionPercentage + '%' }"
            ></div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-container">
          <button
            @click="downloadCompressed"
            class="action-button primary"
          >
            Download Compressed Image
          </button>
          <button
            @click="reset"
            class="action-button secondary"
          >
            Compress Another
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const fileInput = ref(null)
const uploadedFile = ref(null)
const originalFile = ref(null)
const originalImageUrl = ref('')
const compressedImage = ref(null)
const compressedImageUrl = ref('')
const compressedSize = ref(0)
const processing = ref(false)
const isDragging = ref(false)
const originalDimensions = ref('')

const compressionPercentage = computed(() => {
  if (!originalFile.value || !compressedSize.value) return 0
  const saved = ((originalFile.value.size - compressedSize.value) / originalFile.value.size) * 100
  return Math.round(saved)
})

const savedBytes = computed(() => {
  if (!originalFile.value || !compressedSize.value) return 0
  return originalFile.value.size - compressedSize.value
})

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
  
  // Create preview URL
  originalImageUrl.value = URL.createObjectURL(file)
  
  // Get image dimensions
  const img = new Image()
  img.onload = () => {
    originalDimensions.value = `${img.width} × ${img.height}`
  }
  img.src = originalImageUrl.value
  
  // Compress the image
  processing.value = true
  
  try {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await $fetch('/api/compress', {
      method: 'POST',
      body: formData
    })
    
    compressedImage.value = response.compressed
    compressedImageUrl.value = `data:${response.mimeType};base64,${response.compressed}`
    compressedSize.value = response.size
    processing.value = false
  } catch (error) {
    console.error('Compression error:', error)
    const errorMessage = error.data?.message || error.message || 'Failed to compress image. Please try again.'
    alert(errorMessage)
    processing.value = false
    reset()
  }
}

const downloadCompressed = () => {
  if (!compressedImage.value) return
  
  const link = document.createElement('a')
  link.href = compressedImageUrl.value
  link.download = `compressed-${originalFile.value.name}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const reset = () => {
  if (originalImageUrl.value) {
    URL.revokeObjectURL(originalImageUrl.value)
  }
  uploadedFile.value = null
  originalFile.value = null
  originalImageUrl.value = ''
  compressedImage.value = null
  compressedImageUrl.value = ''
  compressedSize.value = 0
  originalDimensions.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.upload-icon-wrapper {
  margin-bottom: 1.5rem;
}
</style>
