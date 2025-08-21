import { pipeline } from "@xenova/transformers";

let extractor: any = null;

export async function getEmbeddings(text: string) {
  try {
    if (!extractor) {
      // Load the embedding model once
      extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }

    // Clean input and extract embeddings
    const cleanText = text.replace(/\n/g, " ");
    const output = await extractor(cleanText, { pooling: "mean", normalize: true });

    return Array.from(output.data) as number[];
  } catch (error) {
    console.error("Error generating embeddings locally", error);
    throw error;
  }
}
