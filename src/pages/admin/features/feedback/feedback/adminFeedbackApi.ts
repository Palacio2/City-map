import { invokeAdminApi } from "@admin/core/api/adminGeoApi";
import type { FeedbackMessage } from './types';

export const adminFeedbackApi = {
    getMessages: () => invokeAdminApi<FeedbackMessage[]>("admin-feedback-manage", { action: "get_messages" }),
    updateStatus: (id: string, status: string) => invokeAdminApi("admin-feedback-manage", { action: "change_status", id, newStatus: status }),
    deleteMessage: (id: string) => invokeAdminApi("admin-feedback-manage", { action: "delete_message", id })
};
