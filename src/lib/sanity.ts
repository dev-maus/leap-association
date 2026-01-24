import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET || 'production';
const apiVersion = import.meta.env.SANITY_API_VERSION || new Date().toISOString().slice(0, 10);

// Only create the client if projectId is configured
export const sanity: SanityClient | null = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
    })
  : null;

const builder = sanity ? imageUrlBuilder(sanity) : null;

export const urlFor = (source: any) => {
  if (!source || !builder) return null;
  return builder.image(source);
};

export const urlForFile = (file: any): string | null => {
  if (!file) return null;
  
  const projectId = import.meta.env.SANITY_PROJECT_ID;
  const dataset = import.meta.env.SANITY_DATASET || 'production';
  
  // If file has a direct URL (from dereferenced asset), use it
  if (file.url) {
    return file.url;
  }
  
  // If file.asset has a URL (dereferenced asset)
  if (file.asset?.url) {
    return file.asset.url;
  }
  
  // Handle different file asset structures
  let assetRef: string | null = null;
  
  if (file.asset) {
    assetRef = file.asset._ref || file.asset._id;
  } else if (file._ref) {
    assetRef = file._ref;
  } else if (typeof file === 'string') {
    assetRef = file;
  }
  
  if (!assetRef) return null;
  
  // If it's already a full URL, return it
  if (typeof assetRef === 'string' && assetRef.startsWith('http')) {
    return assetRef;
  }
  
  // Sanity file asset ref format: "file-{id}-{extension}"
  // Example: "file-9392bc1b2c69a369fb5d3faefa864a9380fa2446-jpg"
  if (assetRef.startsWith('file-')) {
    // Remove "file-" prefix
    const withoutPrefix = assetRef.replace('file-', '');
    
    // Find the last hyphen which separates the ID from the extension
    const lastHyphenIndex = withoutPrefix.lastIndexOf('-');
    if (lastHyphenIndex === -1) return null;
    
    const fileId = withoutPrefix.substring(0, lastHyphenIndex);
    const extension = withoutPrefix.substring(lastHyphenIndex + 1);
    
    return `https://cdn.sanity.io/files/${projectId}/${dataset}/${fileId}.${extension}`;
  }
  
  return null;
};

