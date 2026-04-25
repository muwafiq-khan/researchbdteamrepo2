export interface OpenAlexInstitution {
  id: string;
  display_name: string;
  country_code: string;
  type: string;
}

export interface OpenAlexAuthor {
  id: string;
  display_name: string;
  orcid?: string;
  works_count?: number;
  cited_by_count?: number;
  last_known_institution?: OpenAlexInstitution;
}

export interface OpenAlexAuthorship {
  author_position: string;
  author: OpenAlexAuthor;
  institutions: OpenAlexInstitution[];
}

export interface OpenAlexWork {
  id: string;
  title: string;
  doi: string;
  publication_year: number;
  cited_by_count: number;
  authorships: OpenAlexAuthorship[];
  abstract_inverted_index?: Record<string, number[]>;
  primary_location?: {
    source?: {
      display_name: string;
      host_organization_name: string;
    };
    landing_page_url?: string;
    pdf_url?: string;
  };
  // Reconstructed abstract from inverted index
  abstract?: string;
}

export interface OpenAlexMeta {
  count: number;
  db_response_time_ms: number;
  page: number | null;
  per_page: number;
  next_cursor?: string;
}

export interface OpenAlexResponse<T> {
  meta: OpenAlexMeta;
  results: T[];
}
