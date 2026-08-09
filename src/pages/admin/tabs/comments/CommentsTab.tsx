import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAllComments, hideComment, deleteComment, DistrictComment } from '@/components/stats/api/commentsApi';
import { FaTrash, FaEye, FaEyeSlash, FaStar, FaUserCircle, FaComments, FaSyncAlt } from 'react-icons/fa';
import { RequireRole } from '@/shared/components/guards';
import { supabase } from '@supabaseClient';
import DataTable from '../../ui/DataTable';
import { Badge } from '../../ui/Badge';
import { useModals } from '../../ui/ModalContext';

export default function CommentsTab() {
  const { t } = useTranslation('db');
  const { showConfirm, showAlert } = useModals();
  const [comments, setComments] = useState<DistrictComment[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commentsData, usersRes] = await Promise.all([
        fetchAllComments(),
        supabase.functions.invoke('admin-users-list')
      ]);
      setComments(commentsData || []);
      if (usersRes.data?.users) {
        const map: Record<string, any> = {};
        usersRes.data.users.forEach((u: any) => {
          map[u.id] = { email: u.email, role: u.role };
        });
        setUsersMap(map);
      }
    } catch (err: any) {
      console.error(err);
      showAlert(t('common.error'), err.message || t('admin_comments.tab.error_load'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHide = async (id: string, currentHidden: boolean) => {
    try {
      await hideComment(id, !currentHidden);
      setComments(comments.map(c => c.id === id ? { ...c, is_hidden: !currentHidden } : c));
    } catch (err: any) {
      showAlert(t('common.error'), err.message, 'error');
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(
      t('admin_comments.tab.delete_title'),
      t('admin_comments.tab.delete_desc'),
      async () => {
        try {
          await deleteComment(id);
          setComments(prev => prev.filter(c => c.id !== id));
          showAlert(t('common.success'), t('admin_comments.tab.delete_success'), 'success');
        } catch (err: any) {
          showAlert(t('common.error'), err.message, 'error');
        }
      },
      { confirmVariant: 'danger', confirmText: t('admin_comments.tab.delete_btn') }
    );
  };

  const columns = useMemo(() => [
    {
      header: t('admin_comments.tab.col_date'),
      render: (c: DistrictComment) => (
        <span className="font-mono text-[11px] text-textMuted whitespace-nowrap">
          {new Date(c.created_at).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      header: t('admin_comments.tab.col_author'),
      render: (c: DistrictComment) => {
        const authorInfo = usersMap[c.user_id];
        const authorDisplay = authorInfo?.email || t('admin_comments.tab.anonymous');
        const name = c.full_name || authorDisplay.split('@')[0];

        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-main border border-border flex items-center justify-center text-textMuted text-xs shrink-0 overflow-hidden">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <FaUserCircle className="text-textMuted" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-textMain text-xs truncate">{name}</span>
              {authorDisplay !== t('admin_comments.tab.anonymous') && (
                <span className="text-[10px] text-textMuted truncate">{authorDisplay}</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: t('admin_comments.tab.col_rating'),
      render: (c: DistrictComment) => (
        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded text-[11px] font-mono">
          {c.rating || 5} <FaStar className="text-[9px]" />
        </span>
      )
    },
    {
      header: t('admin_comments.tab.col_comment'),
      render: (c: DistrictComment) => (
        <p className="text-xs text-textMain leading-relaxed m-0 max-w-md break-words" title={c.content}>
          {c.content}
        </p>
      )
    },
    {
      header: t('admin_comments.tab.col_status'),
      render: (c: DistrictComment) => (
        c.is_hidden ? (
          <Badge variant="danger">{t('admin_comments.tab.status_hidden')}</Badge>
        ) : (
          <Badge variant="success">{t('admin_comments.tab.status_visible')}</Badge>
        )
      )
    },
    {
      header: '',
      render: (c: DistrictComment) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => handleToggleHide(c.id, c.is_hidden)}
            className="p-1.5 text-textMuted hover:text-primary hover:bg-primary-subtle rounded transition-colors"
            title={c.is_hidden ? t('admin_comments.tab.show') : t('admin_comments.tab.hide')}
          >
            {c.is_hidden ? <FaEye className="text-xs" /> : <FaEyeSlash className="text-xs" />}
          </button>
          <button
            onClick={() => handleDelete(c.id)}
            className="p-1.5 text-textMuted hover:text-danger hover:bg-danger-subtle rounded transition-colors"
            title={t('admin_comments.tab.delete_forever')}
          >
            <FaTrash className="text-xs" />
          </button>
        </div>
      )
    }
  ], [usersMap]);

  return (
    <RequireRole allowedRoles={['admin', 'super_admin']} fallback={<div className="p-8 text-center text-danger text-xs">{t('admin_comments.tab.no_access')}</div>}>
      <div className="flex flex-col gap-5 w-full">
        
        <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-main text-primary rounded-lg border border-border flex items-center justify-center text-sm">
              <FaComments />
            </div>
            <div>
              <h2 className="m-0 text-base font-semibold text-textMain tracking-tight">
                {t('admin_comments.tab.title')}
              </h2>
              <p className="m-0 text-textMuted text-xs mt-0.5">
                {t('admin_comments.tab.subtitle')} ({comments.length})
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-textMuted hover:text-textMain bg-surface border border-border rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium self-end sm:self-auto"
          >
            <FaSyncAlt className={`text-xs ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </button>
        </div>

        
        <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-textMuted text-xs">
              <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
              <span>{t('admin_comments.tab.loading')}</span>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={comments}
              emptyMessage={t('admin_comments.tab.empty')}
            />
          )}
        </div>
      </div>
    </RequireRole>
  );
}