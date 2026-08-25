export interface GitHubCommit {
  sha: string;
  version: string;
  message: string;
  date: string;
  url: string;
}

export interface AdminTip {
  id: number;
  title: string;
  items: string[];
}

export interface MapCity {
  name: string;
  coords: [number, number];
  zoom?: number;
}

export type AuthStep = 'credentials' | 'mfa_setup' | 'mfa_verify';