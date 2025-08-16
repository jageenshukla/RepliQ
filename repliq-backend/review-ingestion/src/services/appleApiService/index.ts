import axios from 'axios';
import { logObj } from '../../utils/logger';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDb } from '../../utils/db';
import { Connector } from '../../models/Connector';
import { generateAppleJwt } from '../../utils/appleJwt';
import { findConnectorById } from '../connectorService';
import ur from 'zod/v4/locales/ur.cjs';

export class AppleApiService {
  private connector: Connector;
  private jwt: string | null = null;
  private jwtExpiresAt: number = 0;
  private jwtIssuedAt: number = 0;
  private refreshThreshold: number;

  private constructor(connector: Connector, refreshThreshold = 0.8) {
    this.connector = connector;
    this.refreshThreshold = refreshThreshold;
  }

  static async createForConnectorId(connectorId: string, refreshThreshold = 0.8): Promise<AppleApiService> {
    const db = await getDb();
    const connector = await findConnectorById(connectorId);
    if (!connector) throw new Error('Connector not found');
    if (connector.type !== 'apple') throw new Error('Connector is not of type apple');
    const required = ['p8FilePath', 'keyId', 'issuerId', 'bundleId', 'apiUrl'];
    for (const key of required) {
      if (!connector.config?.[key]) throw new Error(`Missing required config: ${key}`);
    }
    // Cast to Connector type after validation
    return new AppleApiService(connector as Connector, refreshThreshold);
  }

  private async getJwt(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (!this.jwt || now >= this.getRefreshTime()) {
      this.jwt = await generateAppleJwt(this.connector.config.bundleId);
      if (!this.jwt) throw new Error('Failed to generate Apple JWT');
      const decoded = jwt.decode(this.jwt) as { exp?: number, iat?: number } | null;
      this.jwtExpiresAt = decoded?.exp ?? 0;
      this.jwtIssuedAt = decoded?.iat ?? now;
    }
    return this.jwt;
  }

  private getRefreshTime(): number {
    const lifetime = this.jwtExpiresAt - this.jwtIssuedAt;
    return this.jwtIssuedAt + Math.floor(lifetime * this.refreshThreshold);
  }


  // Common paginated fetcher for Apple API endpoints
  private async fetchAllPaginatedAppleApi(
    initialUrl: string,
    headers: Record<string, string>,
    dataKey: string = 'data'
  ): Promise<any[]> {
    let url = initialUrl;
    let allData: any[] = [];
    let page = 1;
    while (url) {
      const response: { data: any } = await axios.get(url, { headers });
      const pageData = response.data?.[dataKey] || [];
      allData = allData.concat(pageData);
      url = response.data?.links?.next;
      page++;
    }
    return allData;
  }

  // Fetch all apps from App Store Connect API, with optional pagination aggregation
  async fetchAllApps(
    params?: Record<string, string | number | boolean>,
    fetchAll: boolean = false
  ) {
    const jwt = await this.getJwt();
    let url = `${this.connector.config.apiUrl}/v1/apps`;
    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      url += `?${query}`;
    }
    const headers = { Authorization: `Bearer ${jwt}` };

    if (!fetchAll) {
      const response = await axios.get(url, { headers });
      return response.data;
    } else {
      const allData = await this.fetchAllPaginatedAppleApi(url, headers);
      // Return in the same format as the non-paginated response
      return { data: allData };
    }
  }

  // Fetch customer reviews for a given appId, with optional pagination aggregation
  async fetchCustomerReviews(
    appId: string,
    params?: Record<string, string | number | boolean>,
    nextPageUrl?: string | null
  ) {
    const jwt = await this.getJwt();
    let url = nextPageUrl || `${this.connector.config.apiUrl}/v1/apps/${appId}/customerReviews`;
    if (params && Object.keys(params).length > 0 && !nextPageUrl) {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      url += `?${query}`;
    }
    const headers = { Authorization: `Bearer ${jwt}` };

    try {
      const response = await axios.get(url, { headers });
      const data = (response.data as any);
      const dataArr = Array.isArray(data?.data) ? data.data : [];
      const linksObj = typeof data?.links === 'object' && data?.links !== null ? data.links : {};
      return {
        data: dataArr,
        pagination: {
          nextPageUrl: linksObj.next || null,
          hasMore: !!linksObj.next,
        },
      };
    } catch (err: any) {
      logObj.error('Error Response:', ['apple-api'], {
        message: err.message,
        response: err.response?.data?.errors || err.response?.data,
        config: err.config,
      });
      throw err;
    }
  }
}
