import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import md5 from "md5";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings"; // Local embeddings version
import { convertToAscii } from "./utils";
import path from "path";

/**
 * Initialize Pinecone client (v2)
 */
export const getPineconeClient = () => {
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

/**
 * Load local PDF file, split it into chunks,
 * embed chunks, and upsert into Pinecone.
 */
export async function loadLocalFileIntoPinecone(fileKey: string) {
  const filePath = path.join(process.cwd(),"public", "uploads", fileKey);

  console.log("Loading PDF:", filePath);
  const loader = new PDFLoader(filePath);
  const pages = (await loader.load()) as PDFPage[];

  const documents = await Promise.all(pages.map(prepareDocument));
  const vectors = await Promise.all(documents.flat().map(embedDocument));

  const client = await getPineconeClient();
  const pineconeIndex = client.index("querydoc");
  const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

  console.log("Upserting vectors...");
  await namespace.upsert(vectors);

  return documents[0];
}

async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    return {
      id: md5(doc.pageContent),
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error) {
    console.error("Embedding error:", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");

  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
