import { OpenAlexWork, OpenAlexAuthor, OpenAlexResponse } from '../types/openAlex';

const BASE_URL = 'https://api.openalex.org';
const DEFAULT_PER_PAGE = 10;

/**
 * Reconstructs the abstract string from the inverted index returned by OpenAlex.
 */
function reconstructAbstract(invertedIndex?: Record<string, number[]>): string {
  if (!invertedIndex) return '';
  
  let maxIndex = -1;
  for (const indices of Object.values(invertedIndex)) {
    for (const idx of indices) {
      if (idx > maxIndex) maxIndex = idx;
    }
  }
  
  const words: string[] = new Array(maxIndex + 1).fill('');
  
  for (const [word, indices] of Object.entries(invertedIndex)) {
    for (const idx of indices) {
      words[idx] = word;
    }
  }
  
  return words.join(' ').trim();
}

/**
 * Processes a raw OpenAlex work object to reconstruct the abstract.
 */
function processWork(rawWork: any): OpenAlexWork {
  return {
    ...rawWork,
    abstract: reconstructAbstract(rawWork.abstract_inverted_index)
  };
}

/**
 * Fetches trending/recent works (sorted by citation count, published recently).
 * @param cursor - Cursor for pagination (use '*' for the first page)
 */
export async function getTrendingWorks(cursor: string = '*'): Promise<OpenAlexResponse<OpenAlexWork>> {
  try {
    const currentYear = new Date().getFullYear();
    // Using current year and previous year to ensure we get results
    const response = await fetch(
      `${BASE_URL}/works?sort=cited_by_count:desc&filter=publication_year:${currentYear - 1}-${currentYear}&per_page=${DEFAULT_PER_PAGE}&cursor=${cursor}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch trending works');
    
    const data = await response.json();
    return {
      meta: data.meta,
      results: data.results.map(processWork)
    };
  } catch (error) {
    console.error('Error in getTrendingWorks:', error);
    throw error;
  }
}

/**
 * Fetches a single work by its ID.
 * @param workId - The OpenAlex ID of the work
 */
export async function getWorkById(workId: string): Promise<OpenAlexWork | null> {
  try {
    const shortId = workId.replace('https://openalex.org/', '');
    const response = await fetch(`${BASE_URL}/works/${shortId}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch work');
    }
    
    const data = await response.json();
    return processWork(data);
  } catch (error) {
    console.error('Error in getWorkById:', error);
    throw error;
  }
}

/**
 * Searches for works by keyword or topic.
 * @param query - The search string
 * @param cursor - Cursor for pagination
 */
export async function searchWorks(query: string, cursor: string = '*'): Promise<OpenAlexResponse<OpenAlexWork>> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `${BASE_URL}/works?search=${encodedQuery}&per_page=${DEFAULT_PER_PAGE}&cursor=${cursor}`
    );
    
    if (!response.ok) throw new Error('Failed to search works');
    
    const data = await response.json();
    return {
      meta: data.meta,
      results: data.results.map(processWork)
    };
  } catch (error) {
    console.error('Error in searchWorks:', error);
    throw error;
  }
}

/**
 * Fetches an author's profile by name.
 * Returns the best match (first result).
 * @param name - The author's name
 */
export async function getAuthorProfile(name: string): Promise<OpenAlexAuthor | null> {
  try {
    const encodedName = encodeURIComponent(name);
    const response = await fetch(`${BASE_URL}/authors?search=${encodedName}&per_page=1`);
    
    if (!response.ok) throw new Error('Failed to fetch author profile');
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (error) {
    console.error('Error in getAuthorProfile:', error);
    throw error;
  }
}

/**
 * Fetches papers that cite a specific work.
 * @param workId - The OpenAlex ID of the work (e.g., 'W123456789')
 * @param cursor - Cursor for pagination
 */
export async function getCitationsForPaper(workId: string, cursor: string = '*'): Promise<OpenAlexResponse<OpenAlexWork>> {
  try {
    // OpenAlex IDs are typically URLs, we just need the identifier part or we can pass the full ID
    const shortId = workId.replace('https://openalex.org/', '');
    
    const response = await fetch(
      `${BASE_URL}/works?filter=cites:${shortId}&per_page=${DEFAULT_PER_PAGE}&cursor=${cursor}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch citations');
    
    const data = await response.json();
    return {
      meta: data.meta,
      results: data.results.map(processWork)
    };
  } catch (error) {
    console.error('Error in getCitationsForPaper:', error);
    throw error;
  }
}
