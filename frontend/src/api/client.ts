import {
  Program,
  ProgramSchema,
  CreateProgramInput,
  QuoteInput,
  QuoteResponse,
  QuoteResponseSchema,
  SubmitClaimInput,
  Claim,
  ClaimSchema,
} from './types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail: string,
    public raw?: unknown
  ) {
    super(detail || title);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response, schema?: { parse: (val: unknown) => T }): Promise<T> {
  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {
      // not json
    }
    throw new ApiError(
      res.status,
      errorData.title || `HTTP Error ${res.status}`,
      errorData.detail || res.statusText,
      errorData
    );
  }

  if (res.status === 204) {
    return {} as T;
  }

  const json = await res.json();
  return schema ? schema.parse(json) : (json as T);
}

export const api = {
  // Programs
  async getPrograms(page = 0, size = 50): Promise<{ content: Program[]; totalElements: number }> {
    const res = await fetch(`${API_BASE}/programs?page=${page}&size=${size}`);
    const data = await handleResponse<{ content: unknown[]; totalElements: number }>(res);
    return {
      content: data.content.map((item) => ProgramSchema.parse(item)),
      totalElements: data.totalElements,
    };
  },

  async createProgram(input: CreateProgramInput): Promise<Program> {
    const res = await fetch(`${API_BASE}/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse(res, ProgramSchema);
  },

  // Quotes
  async calculateQuote(input: QuoteInput): Promise<QuoteResponse> {
    const res = await fetch(`${API_BASE}/incentives/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse(res, QuoteResponseSchema);
  },

  // Claims
  async submitClaim(input: SubmitClaimInput): Promise<Claim> {
    const res = await fetch(`${API_BASE}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse(res, ClaimSchema);
  },

  async getClaimById(id: number): Promise<Claim> {
    const res = await fetch(`${API_BASE}/claims/${id}`);
    return handleResponse(res, ClaimSchema);
  },

  async getClaimsByDealer(dealerId: string): Promise<{ content: Claim[] }> {
    const res = await fetch(`${API_BASE}/claims/dealer/${dealerId}`);
    const data = await handleResponse<{ content: unknown[] }>(res);
    return {
      content: data.content.map((item) => ClaimSchema.parse(item)),
    };
  },

  // Health / connectivity check
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/programs?size=1`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
