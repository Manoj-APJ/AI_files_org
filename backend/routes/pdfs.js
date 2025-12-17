const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { extractTextFromPDF, chunkText } = require('../services/pdfExtractor');
const { generateEmbeddings } = require('../services/embeddings');
const { generateTagsForPDF } = require('../services/aiTagging');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

/**
 * POST /api/pdfs/upload
 * Upload and process a PDF file
 */
router.post('/upload', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const userId = req.user.id;
    const file = req.file;
    const originalFilename = file.originalname;

    // Extract text from PDF
    console.log('Extracting text from PDF...');
    const { text, pageCount } = await extractTextFromPDF(file.buffer);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'PDF appears to be empty or unreadable' });
    }

    // Upload file to Supabase Storage
    const filePath = `${userId}/${Date.now()}_${originalFilename}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('pdfs')
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('pdfs')
      .getPublicUrl(filePath);

    // Save PDF metadata to database
    const { data: pdfRecord, error: dbError } = await supabaseAdmin
      .from('pdfs')
      .insert({
        user_id: userId,
        filename: filePath,
        original_filename: originalFilename,
        file_path: filePath,
        file_size: file.size,
        page_count: pageCount,
      })
      .select('id')
      .single();

    if (dbError) {
      // Clean up uploaded file
      await supabaseAdmin.storage.from('pdfs').remove([filePath]);
      throw dbError;
    }

    const pdfId = pdfRecord.id;

    // Chunk the text
    console.log('Chunking PDF text...');
    const chunks = chunkText(text);

    // Generate embeddings for all chunks
    console.log('Generating embeddings...');
    const chunkTexts = chunks.map(chunk => chunk.text);
    const embeddings = await generateEmbeddings(chunkTexts);

    // Store chunks with embeddings in database
    console.log('Storing chunks and embeddings...');
    const chunkRecords = chunks.map((chunk, index) => ({
      pdf_id: pdfId,
      chunk_index: index,
      content: chunk.text,
      page_number: Math.floor((index / chunks.length) * pageCount) + 1,
      embedding: embeddings[index],
    }));

    const { error: chunksError } = await supabaseAdmin
      .from('pdf_chunks')
      .insert(chunkRecords);

    if (chunksError) {
      console.error('Error storing chunks:', chunksError);
      // Continue anyway - PDF is uploaded
    }

    // Generate AI tags
    console.log('Generating AI tags...');
    await generateTagsForPDF(pdfId, text);

    res.status(201).json({
      message: 'PDF uploaded and processed successfully',
      pdf: {
        id: pdfId,
        filename: originalFilename,
        pageCount,
        chunkCount: chunks.length,
        fileUrl: urlData.publicUrl,
      },
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload PDF' });
  }
});

/**
 * GET /api/pdfs
 * Get all PDFs for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: pdfs, error } = await supabaseAdmin
      .from('pdfs')
      .select(`
        id,
        original_filename,
        file_size,
        upload_date,
        page_count,
        file_path,
        tags (
          tag_name,
          confidence
        )
      `)
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });

    if (error) {
      throw error;
    }

    // Get signed URLs for PDFs
    const pdfsWithUrls = await Promise.all(
      (pdfs || []).map(async (pdf) => {
        const { data: urlData } = supabaseAdmin.storage
          .from('pdfs')
          .createSignedUrl(pdf.file_path, 3600); // 1 hour expiry

        return {
          ...pdf,
          fileUrl: urlData?.signedUrl || null,
        };
      })
    );

    res.json({ pdfs: pdfsWithUrls });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

/**
 * GET /api/pdfs/:id/view
 * Get signed URL for viewing a PDF
 */
router.get('/:id/view', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pdfId = req.params.id;

    // Verify ownership
    const { data: pdf, error: fetchError } = await supabaseAdmin
      .from('pdfs')
      .select('file_path')
      .eq('id', pdfId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Generate signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from('pdfs')
      .createSignedUrl(pdf.file_path, 3600);

    if (urlError) {
      throw urlError;
    }

    res.json({
      url: urlData.signedUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Error generating PDF URL:', error);
    res.status(500).json({ error: 'Failed to generate PDF URL' });
  }
});

/**
 * DELETE /api/pdfs/:id
 * Delete a PDF
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pdfId = req.params.id;

    // Verify ownership
    const { data: pdf, error: fetchError } = await supabaseAdmin
      .from('pdfs')
      .select('file_path')
      .eq('id', pdfId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Delete from storage
    await supabaseAdmin.storage.from('pdfs').remove([pdf.file_path]);

    // Delete from database (cascade will delete chunks and tags)
    const { error: deleteError } = await supabaseAdmin
      .from('pdfs')
      .delete()
      .eq('id', pdfId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
});

module.exports = router;

