import { prisma } from './db';

/**
 * Splits text into overlapping chunks for better RAG retrieval.
 */
export function splitText(text: string, chunkSize: number = 1000, chunkOverlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    if (text.length <= chunkSize) return [text];

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - chunkOverlap;

        if (start >= text.length) break;
    }

    return chunks;
}

/**
 * Generates an embedding for a string using OpenAI.
 */
export async function generateEmbedding(text: string, apiKey: string) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            input: text,
            model: 'text-embedding-3-small'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI Embedding Error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

/**
 * Calculates cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Finds the most relevant chunks in the database for a given query embedding.
 */
export async function findRelevantChunks(queryEmbedding: number[], documentIds: string[], topK: number = 3) {
    if (documentIds.length === 0) return [];

    // Fetch all chunks for the selected documents
    const chunks = await prisma.documentChunk.findMany({
        where: {
            documentId: { in: documentIds }
        }
    });

    // Rank chunks by similarity
    const rankedChunks = chunks.map(chunk => {
        const chunkEmbedding = JSON.parse(chunk.embedding) as number[];
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
        return { ...chunk, similarity };
    });

    // Sort and return top K
    return rankedChunks
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
}
