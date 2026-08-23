export interface FeedbackMessage {
    id: string;
    created_at: string;
    type: string;
    email?: string;
    user_email?: string;
    name?: string;
    message: string;
    screenshot_url?: string;
    page_url?: string;
    screen_size?: string;
    browser_info?: string;
    os_info?: string;
    status?: 'new' | 'reviewed' | 'resolved';
}