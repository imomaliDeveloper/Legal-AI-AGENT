export interface LegalDocumentMetadata {
  title: string;
  documentNumber?: string;
  publicationDate?: Date;
  effectiveDate?: Date;
  url: string;
  status?: string;
  documentType?: string;
}

export interface LegalSearchResult {
  documents: LegalDocumentMetadata[];
  totalCount: number;
  sourceId: string;
  sourceName: string;
  retrievedAt: Date;
  isVerified: boolean;
}

export enum DocumentChangeType {
  AMENDMENT = 'AMENDMENT',
  REPEAL = 'REPEAL',
  NEW = 'NEW',
  UPDATE = 'UPDATE',
}

export interface DocumentChange {
  documentUrl: string;
  changeType: DocumentChangeType;
  description: string;
  detectedAt: Date;
  previousVersion?: string;
}
