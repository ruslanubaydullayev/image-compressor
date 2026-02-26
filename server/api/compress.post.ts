import sharp, { type AvailableFormatInfo, type FormatEnum } from 'sharp'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readFormData(event)
    const file = formData.get('image') as File
    
    if (!file) {
      throw createError({
        statusCode: 400,
        message: 'No image file provided'
      })
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Empty file provided'
      })
    }

    // Get original image metadata
    let metadata
    try {
      metadata = await sharp(buffer).metadata()
    } catch (sharpError) {
      console.error('Sharp metadata error:', sharpError)
      throw createError({
        statusCode: 400,
        message: 'Invalid image file. Please ensure the file is a valid image format.'
      })
    }

    const originalSize = buffer.length

    // Determine output format based on input
    let outputFormat = 'jpeg'
    let mimeType = 'image/jpeg'
    
    if (metadata.format === 'png' || metadata.format === 'webp' || metadata.format === 'gif') {
      // For PNG, WebP, and GIF, convert to optimized WebP
      outputFormat = 'webp'
      mimeType = 'image/webp'
    }

    // Compress the image with high quality settings
    let compressedBuffer
    try {
      const sharpInstance = sharp(buffer)
      
      // Only resize if we have valid dimensions
      if (metadata.width && metadata.height) {
        sharpInstance.resize(metadata.width, metadata.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }

      compressedBuffer = await sharpInstance
        .toFormat(outputFormat as keyof FormatEnum | AvailableFormatInfo, {
          quality: outputFormat === 'webp' ? 85 : 90,
          progressive: outputFormat === 'jpeg',
          mozjpeg: outputFormat === 'jpeg' ? true : undefined,
        })
        .toBuffer()
    } catch (sharpError) {
      console.error('Sharp compression error:', sharpError)
      throw createError({
        statusCode: 500,
        message: `Failed to compress image: ${sharpError instanceof Error ? sharpError.message : 'Unknown error'}`
      })
    }

    const compressedSize = compressedBuffer.length

    // Convert to base64 for sending to client
    const base64 = compressedBuffer.toString('base64')

    return {
      compressed: base64,
      mimeType,
      size: compressedSize,
      originalSize,
      format: outputFormat
    }
  } catch (error) {
    console.error('Compression error:', error)
    
    // If it's already a createError, re-throw it
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to compress image'
    })
  }
})
