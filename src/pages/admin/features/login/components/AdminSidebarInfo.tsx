import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaShieldAlt,
  FaMapMarkerAlt,
  FaGithub,
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
  FaCopy,
  FaCheck,
  FaServer,
  FaDatabase
} from 'react-icons/fa';
import { ADMIN_TIPS, GITHUB_CONFIG } from '@admin/core/constants/loginConstants';
import { useGitHubCommits } from '@admin/core/hooks/useGitHubCommits';
import { useSystemStatus } from '@admin/core/hooks/useSystemStatus';

interface AdminSidebarInfoProps {
  onCloseMobile?: () => void;
}

export default function AdminSidebarInfo({ onCloseMobile }: AdminSidebarInfoProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const { commits, loading: commitsLoading } = useGitHubCommits();
  const { dbStatus, apiStatus, stats } = useSystemStatus();
  const { t } = useTranslation('db');

  const handleNextTip = () => setCurrentTipIndex((prev) => (prev + 1) % ADMIN_TIPS.length);
  const handlePrevTip = () => setCurrentTipIndex((prev) => (prev - 1 + ADMIN_TIPS.length) % ADMIN_TIPS.length);

  const handleCopySha = (sha: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  return (
    <div className="w-full h-full p-5 sm:p-6 lg:p-8 flex flex-col justify-between bg-[#faf7f2] dark:bg-[#1f1a17] z-20 overflow-y-auto relative scrollbar-thin">
      <svg className="absolute inset-0 w-full h-full stroke-[#c25e26]/15 fill-none pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="spatial-grid-sidebar" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M0 60 L60 0 L120 60 L60 120 Z" strokeWidth="1" />
            <circle cx="60" cy="60" r="3" className="fill-[#c25e26]/20" />
            <circle cx="0" cy="60" r="2" className="fill-[#c25e26]/20" />
            <circle cx="120" cy="60" r="2" className="fill-[#c25e26]/20" />
          </pattern>
        </defs>
        <rect width="100%" fill="url(#spatial-grid-sidebar)" height="100%" />
      </svg>

      <div className="relative z-10 space-y-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white dark:bg-[#2b2420] border border-[#e2d9cd] dark:border-[#423932] shadow-sm flex items-center justify-center text-[#c25e26]">
              <FaShieldAlt className="text-lg sm:text-xl" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#2a2421] dark:text-[#faf7f2] tracking-tight m-0 leading-tight">
                {t('admin_panel.sidebar.title')}
              </h2>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#8c827a] tracking-normal mt-0.5">
                {t('admin_panel.sidebar.subtitle')}
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-xl bg-[#faf7f2] dark:bg-[#2b2420] border border-[#e8e0d5] text-[#8c827a] hover:text-[#c25e26]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Live System Status Badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] ${dbStatus.online ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <FaDatabase className={`text-xs ${dbStatus.online ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
            <div className="flex flex-col">
              <span className={`font-semibold leading-none ${dbStatus.online ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>{t('admin_panel.status.database')}</span>
              <span className={`text-[9px] font-mono ${dbStatus.online ? 'text-emerald-600/80' : 'text-red-600/80'}`}>{dbStatus.online ? `${t('admin_panel.status.online')} (${dbStatus.latency}ms)` : t('admin_panel.status.offline')}</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] ${apiStatus.online ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <FaServer className={`text-xs ${apiStatus.online ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
            <div className="flex flex-col">
              <span className={`font-semibold leading-none ${apiStatus.online ? 'text-blue-800 dark:text-blue-300' : 'text-red-800 dark:text-red-300'}`}>{t('admin_panel.status.api_gateway')}</span>
              <span className={`text-[9px] font-mono ${apiStatus.online ? 'text-blue-600/80' : 'text-red-600/80'}`}>{apiStatus.online ? `${t('admin_panel.status.healthy')} (${apiStatus.latency}ms)` : t('admin_panel.status.unreachable')}</span>
            </div>
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/70 dark:bg-[#2b2420]/60 border border-[#e8e0d5] dark:border-[#3d332c] text-[10px] font-mono text-[#8c827a]">
          <span className="flex flex-col items-center">
            <span className="font-bold text-[#c25e26] text-sm">{stats.users}</span>
            <span className="opacity-80">{t('admin_panel.stats.users')}</span>
          </span>
          <div className="w-px h-6 bg-[#e8e0d5] dark:bg-[#3d332c]" />
          <span className="flex flex-col items-center">
            <span className="font-bold text-[#c25e26] text-sm">{stats.cities}</span>
            <span className="opacity-80">{t('admin_panel.stats.cities')}</span>
          </span>
          <div className="w-px h-6 bg-[#e8e0d5] dark:bg-[#3d332c]" />
          <span className="flex flex-col items-center">
            <span className="font-bold text-[#c25e26] text-sm">{stats.districts}</span>
            <span className="opacity-80">{t('admin_panel.stats.districts')}</span>
          </span>
        </div>

        {/* Quick Tips */}
        <div className="bg-white/90 dark:bg-[#2b2420]/80 backdrop-blur-xs border border-[#e8e0d5] dark:border-[#3d332c] rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7f76]">
              {t('admin_panel.tips.header')} ({currentTipIndex + 1}/{ADMIN_TIPS.length})
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevTip}
                className="w-6 h-6 rounded-lg bg-[#faf7f2] dark:bg-[#1f1a17] hover:bg-[#ebdcd0] dark:hover:bg-[#38312c] border border-[#e2d9cd] dark:border-[#423932] text-[#61574f] dark:text-[#b8ada2] flex items-center justify-center text-[10px] transition-colors cursor-pointer"
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                onClick={handleNextTip}
                className="w-6 h-6 rounded-lg bg-[#faf7f2] dark:bg-[#1f1a17] hover:bg-[#ebdcd0] dark:hover:bg-[#38312c] border border-[#e2d9cd] dark:border-[#423932] text-[#61574f] dark:text-[#b8ada2] flex items-center justify-center text-[10px] transition-colors cursor-pointer"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div className="min-h-[54px]">
            <p className="text-xs font-bold text-[#2a2421] dark:text-[#faf7f2] mb-1">
              {t(ADMIN_TIPS[currentTipIndex].title)}
            </p>
            <ul className="space-y-1 text-xs text-[#524942] dark:text-[#b8ada2] font-medium">
              {ADMIN_TIPS[currentTipIndex].items.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <FaMapMarkerAlt className="text-[#c25e26] text-[10px] mt-0.5 shrink-0" />
                  <span className="leading-tight">{t(tip)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* GitHub Updates */}
        <div className="bg-white/70 dark:bg-[#2b2420]/60 backdrop-blur-xs border border-[#e8e0d5] dark:border-[#3d332c] rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7f76] flex items-center gap-1.5 truncate">
              <FaGithub className="text-xs shrink-0" /> {t('admin_panel.updates.header')} ({GITHUB_CONFIG.owner}/{GITHUB_CONFIG.repo})
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-[#e0d6cb] dark:border-[#423932] ml-1 pl-3">
            {commitsLoading ? (
              <div className="text-xs text-[#8a7f76]">{t('admin_panel.updates.loading')}</div>
            ) : (
              commits.map((commit, idx) => (
                <div key={commit.sha || idx} className="relative group">
                  <span className={`absolute -left-[17px] top-1.5 w-2 h-2 rounded-full ring-4 ring-[#faf7f2] dark:ring-[#1f1a17] ${idx === 0 ? 'bg-[#c25e26]' : 'bg-[#b8ada2]'}`} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2a2421] dark:text-[#faf7f2]">
                      {commit.version}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopySha(commit.sha, e)}
                      className="inline-flex items-center gap-1 text-[9px] font-mono text-[#8a7f76] hover:text-[#c25e26] bg-[#faf7f2] dark:bg-[#1a1614] px-1 py-0.5 rounded border border-[#e8e0d5] dark:border-[#38312c] transition-colors"
                      title="Copy SHA"
                    >
                      <span>{commit.sha}</span>
                      {copiedSha === commit.sha ? (
                        <FaCheck className="text-emerald-500 text-[8px]" />
                      ) : (
                        <FaCopy className="text-[8px]" />
                      )}
                    </button>
                  </div>
                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#6b625a] dark:text-[#a69c92] font-normal leading-tight line-clamp-1 group-hover:text-[#c25e26] transition-colors flex items-center gap-1 mt-0.5"
                  >
                    <span>{commit.message}</span>
                    {commit.url !== '#' && <FaExternalLinkAlt className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Useful Links */}
        <div className="bg-white/70 dark:bg-[#2b2420]/60 backdrop-blur-xs border border-[#e8e0d5] dark:border-[#3d332c] rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a7f76] mb-1">
            {t('admin_panel.links.header')}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-[#c25e26]">
            <a href="#status" className="hover:underline">{t('admin_panel.links.status')}</a>
            <a href="#docs" className="hover:underline">{t('admin_panel.links.security')}</a>
            <a href="#api" className="hover:underline">{t('admin_panel.links.api')}</a>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-4 pt-3 border-t border-[#e8e0d5] dark:border-[#38312c] text-[10px] text-[#9c9187] text-center sm:text-left">
        © {new Date().getFullYear()} CityMaps Inc. {t('admin_panel.footer.rights')}
      </div>
    </div>
  );
}