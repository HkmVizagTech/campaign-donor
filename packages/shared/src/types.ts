export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface DonorDTO {
  _id: string;
  donorId?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  donationAmount?: number;
  donationDate?: string;
  donationReference?: string;
  brickName?: string;
  source?: string;
  importBatchId?: string;
  notes?: string;
  duplicatePhone?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDTO {
  _id: string;
  campaignId: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalYes: number;
  totalNo: number;
  totalPending: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipientDTO {
  _id: string;
  campaignId: string;
  donorId: string;
  phone: string;
  response: string;
  responseAt?: string;
  messageStatus: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  externalMessageId?: string;
  brickStatus: string;
  donor?: DonorDTO;
  createdAt: string;
  updatedAt: string;
}

export interface ImportBatchDTO {
  _id: string;
  batchId: string;
  fileName: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  duplicateRows: number;
  status: string;
  errors: Array<{ row: number; field: string; message: string }>;
  importedBy: string;
  createdAt: string;
}

export interface DashboardStats {
  totalDonors: number;
  activeCampaigns: number;
  campaign?: {
    _id: string;
    name: string;
    totalRecipients: number;
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalYes: number;
    totalNo: number;
    totalPending: number;
  };
}
