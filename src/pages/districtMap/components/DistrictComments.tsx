import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchComments, addComment, DistrictComment } from '@stats/api/commentsApi';
import { useAuth } from '@/pages/auth/context/AuthContext';
import { FaUserCircle, FaPaperPlane, FaStar } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { getSignedAvatarUrl } from '@/pages/profile/api/storageApi';

interface DistrictCommentsProps {
  districtId: string;
}

export const DistrictComments: React.FC<DistrictCommentsProps> = ({ districtId }) => {
  const { t } = useTranslation('db');
  const { session } = useAuth();
  const avatarPath = session?.user?.user_metadata?.avatar_url;
  const { data: ownAvatar } = useQuery({
    queryKey: ['comment-avatar', session?.user.id, avatarPath],
    queryFn: () => getSignedAvatarUrl(avatarPath),
    enabled: typeof avatarPath === 'string' && !!avatarPath,
    staleTime: 50 * 60 * 1000,
    refetchInterval: 50 * 60 * 1000,
    retry: false,
  });
  
  const [comments, setComments] = useState<DistrictComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    let active = true;
    setComments([]);
    setLoading(true);
    const loadComments = async () => {
      try {
        const data = await fetchComments(districtId);
        if (active) setComments(data);
      } catch (err) {
        console.error('Failed to load comments', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    if (districtId) {
      loadComments();
    }
    // Renew five-minute avatar links while the comments remain mounted.
    const timer = setInterval(() => { if (districtId) void loadComments(); }, 240_000);
    return () => { active = false; clearInterval(timer); };
  }, [districtId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;
    
    setSubmitting(true);
    try {
      const added = await addComment(districtId, newComment.trim(), newRating);
      setComments([added, ...comments]);
      setNewComment('');
      setNewRating(5);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('comments.add_error'));
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="p-4 text-center text-textSecondary">{t('common.status.loading')}</div>;
  }
  
  return (
    <div className="flex flex-col gap-6 mt-2 max-w-3xl mx-auto w-full pb-8">
      {session ? (
        <form onSubmit={handleSubmit} className="bg-surface border border-borderClient p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col gap-4 transition-all focus-within:border-accent/40 focus-within:shadow-md">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0 relative overflow-hidden border border-accent/20">
                 <FaUserCircle className="text-2xl absolute opacity-50" />
                 {ownAvatar && (
                   <img key={ownAvatar} src={ownAvatar} alt="" className="w-full h-full object-cover relative z-10 bg-surface" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                 )}
               </div>
               <div className="flex flex-col">
                 <span className="text-sm font-semibold text-textMain">{session.user?.user_metadata?.full_name || session.user?.email || t('comments.your_review', 'Ваш відгук')}</span>
                 <span className="text-xs text-textSecondary">{t('comments.share_experience', 'Поділіться досвідом')}</span>
               </div>
            </div>
            
            <div className="flex items-center gap-1 bg-body px-2 py-1.5 rounded-lg border border-borderClient self-start sm:self-auto">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  className={`text-xl sm:text-lg focus:outline-hidden transition-transform hover:scale-110 ${star <= newRating ? 'text-yellow-400 drop-shadow-xs' : 'text-slate-200 dark:text-slate-700'}`}
                >
                  <FaStar />
                </button>
              ))}
            </div>
          </div>
          
          <textarea
            maxLength={5000}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('comments.placeholder')}
            className="w-full bg-body border border-borderClient rounded-xl px-4 py-3 text-sm text-textMain min-h-[100px] resize-none focus:outline-hidden focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-textMuted custom-scrollbar"
            disabled={submitting}
          />
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="bg-accent text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <FaPaperPlane className="text-xs" />
              {submitting ? t('common.saving') : t('comments.submit', 'Залишити відгук')}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-body border border-borderClient rounded-2xl p-6 text-sm flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center">
            <FaUserCircle className="text-2xl" />
          </div>
          <span className="font-medium text-center text-textMain">{t('comments.auth_required')}</span>
        </div>
      )}
      
      <div className="flex flex-col gap-4 mt-2">
        {comments.length > 0 && (
          <h3 className="text-lg font-heading font-semibold text-textMain mb-1">
            {t('comments.list_title', 'Відгуки мешканців')} <span className="text-textSecondary font-normal text-sm ml-1">({comments.length})</span>
          </h3>
        )}
        
        {comments.length === 0 ? (
          <div className="text-center text-sm text-textSecondary py-12 bg-surface border border-dashed border-borderClient rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 bg-body rounded-full flex items-center justify-center text-textMuted text-xl mb-1">
              <FaStar />
            </div>
            <span>{t('comments.empty')}</span>
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="py-4 border-b border-borderClient last:border-0 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-body border border-borderClient flex items-center justify-center text-textMuted shrink-0 relative overflow-hidden">
                    <FaUserCircle className="text-2xl absolute opacity-50" />
                    {c.avatar_url && (
                      <img key={c.avatar_url} src={c.avatar_url} alt="" className="w-full h-full object-cover relative z-10 bg-surface" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-textMain text-sm">{c.full_name || t('comments.default_user')}</span>
                    <span className="text-[11px] text-textSecondary">{c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar key={star} className={`text-[12px] ${star <= (c.rating || 5) ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-700'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-textMain leading-relaxed m-0 mt-1 whitespace-pre-wrap sm:pl-12">{c.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
