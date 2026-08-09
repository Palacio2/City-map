export type FeedbackType = 'critical' | 'data_error' | 'ui_bug' | 'suggestion';

export interface FeedbackPayload {
  email?: string;
  message: string;
  type: FeedbackType;
  user_id?: string;
  page_url: string;
  screenshot_url?: string | null;
  screen_size: string;
  browser_info: string;
}

export interface FeedbackFormState {
  type: FeedbackType;
  message: string;
}