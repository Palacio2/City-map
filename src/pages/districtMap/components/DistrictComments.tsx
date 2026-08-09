import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchComments, addComment, DistrictComment } from '@stats/api/commentsApi';
import { useAuth } from '@/pages/auth/context/AuthContext';
import { FaUserCircle, FaPaperPlane, FaStar } from 'react-icons/fa';

interface DistrictCommentsProps {
  districtId: string;
}

export const DistrictComments: React.FC<DistrictCommentsProps> = ({ districtId }) => {
  const { t } = useTranslation('db');
  const { session } = useAuth();
  
  const [comments, setComments] = useState<DistrictComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const loadComments = async () => {
      try {
        const data = await fetchComments(districtId);
        setComments(data);
      } catch (err) {
        console.error('Failed to load comments', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (districtId) {
      loadComments();
    }
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
    } catch (err: any) {
      alert(err.message || 'Помилка при додаванні коментаря');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="p-4 text-center text-textSecondary">{t('common.status.loading', 'Завантаження...')}</div>;
  }
  
  return (
    <div className="flex flex-col gap-4 mt-4">
      {session ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm font-semibold text-textSecondary">Оцінка:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  className="text-xl focus:outline-none transition-transform hover:scale-110"
                >
                  <FaStar className={star <= newRating ? 'text-yellow-400' : 'text-slate-300'} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Написати відгук..."
              className="flex-1 bg-surface border border-borderClient rounded-lg px-4 py-2 text-sm text-textMain focus:outline-none focus:border-accent transition-colors"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="bg-accent text-white px-4 py-2 rounded-lg flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <FaPaperPlane />
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-warning/10 text-warning border border-warning/20 rounded-lg p-3 text-sm text-center">
          Зареєструйтесь, щоб залишати коментарі.
        </div>
      )}
      
      <div className="flex flex-col gap-3 mt-2">
        {comments.length === 0 ? (
          <div className="text-center text-sm text-textSecondary py-4">Ще немає коментарів. Будьте першим!</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-surface border border-borderClient rounded-lg p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-textSecondary">
                <div className="flex items-center gap-2 font-semibold">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <FaUserCircle className="text-textMuted text-lg" />
                  )}
                  <span>{c.full_name || 'Користувач'}</span>
                </div>
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar key={star} className={`text-sm ${star <= (c.rating || 5) ? 'text-yellow-400' : 'text-slate-300'}`} />
                ))}
              </div>
              <p className="text-sm text-textMain m-0">{c.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
