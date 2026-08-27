/**
 * F10b + F10c — Ingesta de documentos para el bot del directorio (RAG).
 *
 * Flujo:
 *  1. Recibe el buffer + metadata del archivo desde el endpoint.
 *  2. Extrae texto según mimeType (PDF, DOCX, TXT).
 *  3. Chunkea en pedazos ~500 tokens con overlap ~100 tokens.
 *  4. Genera embeddings para cada chunk.
 *  5. Persiste chunks + vectores en Postgres con pgvector.
 *  6. Actualiza el estado del IaAgentDocument.
 *
 * Es async: el endpoint responde 202 y este proceso corre en background.
 */

const { PrismaClient } = require('@prisma/client');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const embeddings = require('./embeddings.service');
const Anthropic = require('@anthropic-ai/sdk');

const prisma = new PrismaClient();

const CHUNK_CHARS = 2000;   // ~500 tokens (regla de dedo: 4 chars ≈ 1 token)
const OVERLAP_CHARS = 400;  // ~100 tokens de overlap
const MAX_CHUNKS = 200;     // techo de seguridad por documento

/** Aproxima tokens desde chars. */
function approxTokens(chars) {
  return Math.ceil(chars / 4);
}

// Formatos de imagen que acepta la API de Anthropic.
const IMAGE_MIME = {
  'image/jpeg': 'image/jpeg', 'image/jpg': 'image/jpeg', 'image/png': 'image/png',
  'image/gif': 'image/gif', 'image/webp': 'image/webp',
};
const IMAGE_EXT = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
};

/**
 * Transcribe una imagen a texto con Claude. Sirve para lo que el profesional
 * tiene en papel: listas de precios, folletos de marca, catálogos fotografiados.
 * El texto resultante entra al mismo troceado y vectorizado que un PDF.
 */
async function transcribeImage(buffer, mediaType, filename) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('Falta ANTHROPIC_API_KEY: no puedo leer imágenes.');
    err.code = 'NO_VISION_KEY';
    throw err;
  }
  const client = new Anthropic();
  const res = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') } },
        {
          type: 'text',
          text: [
            'Transcribe TODO el texto de esta imagen en español, tal cual aparece.',
            'Es material de un centro auditivo: puede ser una lista de precios, un folleto de audífonos,',
            'un catálogo de marcas o un protocolo de atención.',
            '',
            'Reglas:',
            '- Conserva cifras, referencias y nombres de producto EXACTAMENTE como están. No redondees precios.',
            '- Si hay tablas, escríbelas como texto plano legible, una fila por línea.',
            '- No resumas, no interpretes, no agregues nada que no esté en la imagen.',
            '- Si algo no se alcanza a leer, escribe [ilegible] en ese punto en vez de adivinar.',
            '- Si la imagen no tiene texto, describe brevemente qué muestra.',
          ].join('\n'),
        },
      ],
    }],
  });
  if (res.stop_reason === 'refusal') {
    const err = new Error('No se pudo leer la imagen.');
    err.code = 'VISION_REFUSAL';
    throw err;
  }
  const texto = (res.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  if (!texto) {
    const err = new Error(`Sin texto extraíble en "${filename}".`);
    err.code = 'EMPTY_IMAGE';
    throw err;
  }
  return texto;
}

/** Extrae texto plano según el mimeType. */
async function extractText(buffer, mimeType, filename) {
  const mt = String(mimeType || '').toLowerCase();
  const ext = String(filename || '').toLowerCase().split('.').pop();

  if (mt === 'application/pdf' || ext === 'pdf') {
    const parsed = await pdfParse(buffer);
    return parsed.text || '';
  }
  if (mt.includes('officedocument.wordprocessingml') || mt === 'application/msword' || ext === 'docx' || ext === 'doc') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  if (mt.startsWith('text/') || ext === 'txt' || ext === 'md') {
    return buffer.toString('utf-8');
  }
  if (IMAGE_MIME[mt] || IMAGE_EXT[ext]) {
    return transcribeImage(buffer, IMAGE_MIME[mt] || IMAGE_EXT[ext], filename);
  }
  const err = new Error(`Formato no soportado: ${mt || ext}`);
  err.code = 'UNSUPPORTED_FORMAT';
  throw err;
}

/**
 * Chunkea texto en pedazos con overlap. Respeta párrafos cuando puede.
 * @returns {string[]}
 */
function chunkText(text) {
  const cleaned = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!cleaned) return [];

  const chunks = [];
  let start = 0;
  while (start < cleaned.length && chunks.length < MAX_CHUNKS) {
    let end = Math.min(start + CHUNK_CHARS, cleaned.length);
    // Intenta cortar en un límite de párrafo cercano al final del chunk
    if (end < cleaned.length) {
      const searchStart = Math.max(start + CHUNK_CHARS - 300, start);
      const paragraphBreak = cleaned.lastIndexOf('\n\n', end);
      const sentenceBreak = cleaned.lastIndexOf('. ', end);
      const cutPoint = paragraphBreak >= searchStart ? paragraphBreak + 2
        : sentenceBreak >= searchStart ? sentenceBreak + 2
        : end;
      end = cutPoint;
    }
    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    if (end >= cleaned.length) break;
    start = Math.max(end - OVERLAP_CHARS, start + 1);
  }
  return chunks;
}

/**
 * Procesa un documento completo. Cambia el status del row a PROCESSING,
 * extrae texto, chunkea, embed, guarda chunks, marca READY.
 * En caso de error marca FAILED con mensaje.
 */
async function processDocument({ documentId, buffer, mimeType, filename, configId }) {
  await prisma.iaAgentDocument.update({
    where: { id: documentId },
    data: { status: 'PROCESSING' },
  });

  try {
    const text = await extractText(buffer, mimeType, filename);
    if (!text.trim()) {
      throw Object.assign(new Error('No se pudo extraer texto del documento'), { code: 'NO_TEXT' });
    }
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      throw Object.assign(new Error('El documento no contiene texto usable'), { code: 'NO_CHUNKS' });
    }

    // Embeddings en batch
    const vectors = await embeddings.embedTexts(chunks);

    // Inserta con SQL crudo para poder usar el tipo vector
    for (let i = 0; i < chunks.length; i++) {
      const vecLit = embeddings.toVectorLiteral(vectors[i] || []);
      const content = chunks[i].slice(0, 8000); // guard
      const tokens = approxTokens(content.length);
      const id = require('crypto').randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "ia_agent_document_chunks" ("id", "documentId", "configId", "chunkIndex", "content", "tokenCount", "embedding")
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector)`,
        id, documentId, configId, i, content, tokens, vecLit,
      );
    }

    await prisma.iaAgentDocument.update({
      where: { id: documentId },
      data: {
        status: 'READY',
        chunkCount: chunks.length,
        totalChars: text.length,
        errorMessage: null,
      },
    });

    return { ok: true, chunks: chunks.length, chars: text.length };
  } catch (e) {
    console.error('[ingestion] documento', documentId, 'falló:', e.message);
    await prisma.iaAgentDocument.update({
      where: { id: documentId },
      data: {
        status: 'FAILED',
        errorMessage: (e.message || 'Error desconocido').slice(0, 500),
      },
    });
    return { ok: false, error: e.message, code: e.code };
  }
}

/** Elimina un documento y sus chunks. */
async function deleteDocument(documentId) {
  await prisma.iaAgentDocumentChunk.deleteMany({ where: { documentId } });
  await prisma.iaAgentDocument.delete({ where: { id: documentId } });
  return { ok: true };
}

/**
 * Recupera top-K chunks más similares a una query para un config específico.
 * Usa distancia coseno con pgvector: `<=>` operador.
 */
async function retrieveTopKChunks({ configId, query, k = 3 }) {
  if (!query || !query.trim()) return [];
  const vec = await embeddings.embedQuery(query);
  const vecLit = embeddings.toVectorLiteral(vec);
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT "id", "documentId", "chunkIndex", "content",
              (1 - ("embedding" <=> $1::vector)) AS similarity
       FROM "ia_agent_document_chunks" c
       WHERE c."configId" = $2
         AND EXISTS (SELECT 1 FROM "ia_agent_documents" d
                     WHERE d."id" = c."documentId" AND d."isActive" = TRUE AND d."status" = 'READY')
       ORDER BY "embedding" <=> $1::vector
       LIMIT $3`,
      vecLit, configId, k,
    );
    return rows.map((r) => ({
      id: r.id,
      documentId: r.documentId,
      chunkIndex: r.chunkIndex,
      content: r.content,
      similarity: Number(r.similarity),
    }));
  } catch (e) {
    console.warn('[retrieval] falló:', e.message);
    return [];
  }
}

module.exports = { processDocument, deleteDocument, retrieveTopKChunks };
