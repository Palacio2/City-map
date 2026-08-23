import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTrash, FaEye, FaEyeSlash, FaStar, FaUserCircle, FaComments, FaSyncAlt } from 'react-icons/fa';
import DataTable, { Column } from '@admin/core/ui/DataTable';
import { Badge } from '@admin/core/ui/Badge';
import { CustomSelect } from '@admin/core/ui/CustomSelect';
import { DistrictComment } from '@/components/stats/api/commentsApi';
import { useComments } from '@admin/features/feedback/comments/useComments';
import { useActionGuard } from '@admin/core/context/useActionGuard';
import { Button } from '@admin/core/ui/Button';

export default function CommentsTab() {
  const { t } = useTranslation('db');
  const { canDo } = useActionGuard();
  const {
    comments, usersMap, loading, loadData, handleToggleHide, handleDelete,
    cities, districts, selectedCity, setSelectedCity, selectedDistrict, setSelectedDistrict, districtsLoading
  } = useComments();

  const columns = useMemo<Column<DistrictComment>[]>(() => [
    {
      header: t('admin_comments.tab.col_date'),
      render: (c: DistrictComment) => {
        const dateObj = new Date(c.created_at);
        return (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-xs text-textMain whitespace-nowrap">
              {dateObj.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
            <span className="font-mono font-semibold text-[10px] text-textMuted whitespace-nowrap">
              {dateObj.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      }
    },
    {
      header: t('admin_comments.tab.col_author'),
      render: (c: DistrictComment) => {
        const authorInfo = usersMap[c.user_id];
        const authorDisplay = authorInfo?.email || t('admin_comments.tab.anonymous');
        const name = c.full_name || authorDisplay.split('@')[0];
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-textMuted text-sm shrink-0 overflow-hidden shadow-sm">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <FaUserCircle className="text-textMuted/60" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-textMain text-xs truncate">{name}</span>
              {authorDisplay !== t('admin_comments.tab.anonymous') && (
                <span className="text-[10px] text-textMuted font-medium truncate">{authorDisplay}</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: t('admin_comments.tab.col_rating'),
      render: (c: DistrictComment) => (
        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
          {c.rating || 5} <FaStar className="text-[10px] mb-0.5" />
        </span>
      )
    },
    {
      header: t('admin_comments.tab.col_comment'),
      render: (c: DistrictComment) => (
        <p className="text-xs text-textMain leading-relaxed m-0 max-w-[300px] sm:max-w-md break-words font-medium opacity-90 line-clamp-3 hover:line-clamp-none transition-all" title={c.content}>
          {c.content}
        </p>
      )
    },
    {
      header: t('admin_comments.tab.col_status'),
      render: (c: DistrictComment) => (
        c.is_hidden ? (
          <Badge variant="danger" className="opacity-80">{t('admin_comments.tab.status_hidden')}</Badge>
        ) : (
          <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{t('admin_comments.tab.status_visible')}</Badge>
        )
      )
    },
    {
      header: '',
      render: (c: DistrictComment) => (
        <div className="flex items-center gap-1 justify-end">
          {canDo('comments.hide') && (
            <button
              onClick={() => handleToggleHide(c.id, Boolean(c.is_hidden))}
              className="p-2 text-textMuted hover:text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
              title={c.is_hidden ? t('admin_comments.tab.show') : t('admin_comments.tab.hide')}
            >
              {c.is_hidden ? <FaEye className="text-sm" /> : <FaEyeSlash className="text-sm" />}
            </button>
          )}
          {canDo('comments.delete') && (
            <button
              onClick={() => handleDelete(c.id)}
              className="p-2 text-textMuted hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
              title={t('admin_comments.tab.delete_forever')}
            >
              <FaTrash className="text-sm" />
            </button>
          )}
        </div>
      )
    }
  ], [usersMap, t, handleToggleHide, handleDelete, canDo]);

  return (
    <div className="flex flex-col gap-6 w-full pb-4 flex-1 h-full">
      {/* Хедер та фільтри */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <FaComments className="text-lg" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-base sm:text-lg font-bold text-textMain tracking-tight">
                {t('admin_comments.tab.title')}
              </h2>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                {comments.length}
              </span>
            </div>
            <p className="m-0 text-textMuted text-xs font-medium mt-0.5">
              {t('admin_comments.tab.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          <div className="w-48">
            <CustomSelect
              value={selectedCity}
              onChange={(val) => setSelectedCity(String(val))}
              options={[
                { value: '', label: t('admin_comments.tab.all_cities') },
                ...cities.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))
              ]}
              placeholder={t('admin_comments.tab.all_cities')}
            />
          </div>
          
          <div className="w-48">
            <CustomSelect
              value={selectedDistrict}
              onChange={(val) => setSelectedDistrict(String(val))}
              disabled={!selectedCity || districtsLoading}
              options={[
                { value: '', label: t('admin_comments.tab.all_districts') },
                ...districts.map((d: { id: string; name: string }) => ({ value: d.id, label: d.name }))
              ]}
              placeholder={t('admin_comments.tab.all_districts')}
            />
          </div>
          
          <Button
            variant="cancel"
            size="md"
            onClick={() => loadData()}
            disabled={loading}
            className="h-10 border-border bg-surface hover:bg-hover text-textMain"
          >
            <FaSyncAlt className={`${loading ? 'animate-spin text-primary' : 'text-textMuted'}`} />
            <span className="hidden sm:inline ml-1 font-bold">{t('admin_comments.tab.refresh')}</span>
          </Button>
        </div>
      </div>

      {/* Таблиця */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col flex-1">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-textMuted text-xs font-bold tracking-wide uppercase">{t('admin_comments.tab.loading')}</span>
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
  );
}