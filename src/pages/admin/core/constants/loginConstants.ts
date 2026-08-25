import { AdminTip } from '@admin/core/types/login.types';

export const GITHUB_CONFIG = {
  owner: import.meta.env.VITE_GITHUB_OWNER || "Palacio2",
  repo: import.meta.env.VITE_GITHUB_REPO || "City-map",
};

export const ADMIN_TIPS: AdminTip[] = [
  {
    id: 1,
    title: "admin_panel.tips.title_1",
    items: [
      "admin_panel.tips.item_1_1",
      "admin_panel.tips.item_1_2"
    ]
  },
  {
    id: 2,
    title: "admin_panel.tips.title_2",
    items: [
      "admin_panel.tips.item_2_1",
      "admin_panel.tips.item_2_2"
    ]
  },
  {
    id: 3,
    title: "admin_panel.tips.title_3",
    items: [
      "admin_panel.tips.item_3_1",
      "admin_panel.tips.item_3_2"
    ]
  }
];