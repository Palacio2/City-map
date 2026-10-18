import { HiOutlineLightBulb, HiX, HiCamera, HiTrash, HiOutlineGift } from 'react-icons/hi';
import { useFeedbackWidget } from './hooks/useFeedbackWidget';
import type { FeedbackType } from './types';
import { CustomSelect } from '@pages/admin/core/ui/CustomSelect';

export default function FeedbackWidget() {
  const {
    session,
    showRodoModal,
    isOpen,
    isClosing,
    showHint,
    sent,
    errorMsg,
    widgetRef,
    formData,
    isCapturing,
    screenshotPreview,
    isPending,
    setShowHint,
    toggleModal,
    handleCapture,
    handleSubmit,
    removeScreenshot,
    updateType,
    updateMessage,
    t
  } = useFeedbackWidget();

  if (!session || showRodoModal) return null;

  return (
    <div
      ref={widgetRef}
      className="fixed z-[9999] flex flex-col items-end gap-4 pointer-events-none"
      style={{
        bottom: 'max(30px, env(safe-area-inset-bottom))',
        right: 'max(30px, env(safe-area-inset-right))'
      }}
    >
      {showHint && !isOpen && !isClosing && (
        <div className="pointer-events-auto bg-surface rounded-2xl p-4 flex items-start gap-4 max-w-[320px] animate-slideUp relative pr-12 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] border border-borderClient">
          <HiOutlineGift className="text-3xl text-accent shrink-0 animate-pulse" />
          <div className="flex flex-col gap-1 text-[13px] text-textSecondary">
            <strong className="text-textMain font-heading text-[15px]">{t('feedback.hint.title')}</strong>
            <span className="leading-relaxed">{t('feedback.hint.subtitle')}</span>
          </div>
          <button
            type="button"
            className="absolute top-4 right-4 text-textSecondary hover:text-textMain transition-colors bg-body w-6 h-6 rounded-full flex items-center justify-center"
            onClick={() => setShowHint(false)}
            aria-label={t('feedback.actions.close')}
          >
            <HiX size={14} />
          </button>
        </div>
      )}

      {(isOpen || isClosing) && (
        <>
          {/* Mobile Overlay */}
          <div 
            className={`fixed inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto sm:hidden transition-opacity duration-300 ${isClosing ? 'animate-fade-out-custom sm:opacity-0' : 'animate-fadeIn sm:opacity-100'}`}
            onClick={toggleModal}
          />
          <div className={`
            pointer-events-auto 
            fixed sm:relative
            bottom-0 sm:bottom-auto
            left-0 sm:left-auto
            right-0 sm:right-auto
            w-full sm:w-[380px]
            bg-surface 
            rounded-t-[2rem] sm:rounded-[2rem] 
            border-t sm:border border-borderClient 
            shadow-[0_-10px_40px_rgba(0,0,0,0.15)] sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] 
            origin-bottom transition-all duration-300 ease-out z-50 sm:z-auto
            ${isClosing 
              ? 'animate-slide-down-sheet sm:animate-widget-desktop-exit' 
              : 'animate-slide-up-sheet sm:animate-widget-desktop-enter'
            }
          `}>
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-borderClient rounded-full mx-auto mt-4 sm:hidden" />
          
          <div className="relative p-6 sm:p-8 pb-4">
            <button
              type="button"
              onClick={toggleModal}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-body text-textSecondary hover:bg-borderClient hover:text-textMain transition-colors flex items-center justify-center"
              aria-label={t('feedback.actions.close')}
            >
              <HiX className="text-[15px]" />
            </button>
            <h3 className="font-heading font-bold text-xl text-textMain pr-8">{t('feedback.modal.title')}</h3>
            <p className="text-[14px] text-textSecondary mt-2 leading-relaxed">{t('feedback.modal.subtitle')}</p>
          </div>

          {sent ? (
            <div className="p-8 pb-12 text-center flex flex-col items-center gap-4">
              <div className="text-6xl animate-bounce mt-4">✨</div>
              <h4 className="font-bold text-success text-xl">{t('feedback.modal.success_title')}</h4>
              <p className="text-[15px] text-textSecondary px-4">{t('feedback.modal.success_desc')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-6 sm:pb-8 flex flex-col gap-5 relative z-10">
              {errorMsg && (
                <div className="bg-danger/10 text-danger border border-danger/20 p-4 rounded-2xl text-[13px] font-medium text-center animate-popIn">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col gap-2 relative z-20">
                <label className="text-[12px] font-bold text-textMain uppercase tracking-widest ml-1 opacity-90">
                  {t('feedback.fields.type_label')}
                </label>
                <CustomSelect
                  value={formData.type}
                  onChange={(val) => updateType(val as FeedbackType)}
                  options={[
                    { value: 'critical', label: t('feedback.types.critical') },
                    { value: 'data_error', label: t('feedback.types.data_error') },
                    { value: 'ui_bug', label: t('feedback.types.ui_bug') },
                    { value: 'suggestion', label: t('feedback.types.suggestion') }
                  ]}
                  disabled={isPending}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-textMain uppercase tracking-widest ml-1 opacity-90">
                  {t('feedback.fields.description_label')}
                </label>
                <textarea
                  placeholder={t('feedback.fields.description_placeholder')}
                  value={formData.message}
                  onChange={e => updateMessage(e.target.value)}
                  className="w-full px-4 py-3.5 bg-body border-none rounded-2xl text-textMain text-[14px] transition-all ring-1 ring-borderClient focus:outline-hidden focus:ring-2 focus:ring-accent placeholder-textSecondary/50 resize-y min-h-[120px]"
                  disabled={isPending}
                />
              </div>

              <div className="w-full mt-1">
                {!screenshotPreview ? (
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={isCapturing || isPending}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-body text-textMain text-[14px] font-bold ring-1 ring-borderClient hover:ring-accent hover:text-accent transition-all disabled:opacity-50 group"
                  >
                    <HiCamera className="text-xl text-textSecondary group-hover:text-accent transition-colors" />
                    {isCapturing ? t('feedback.actions.capturing') : t('feedback.actions.capture')}
                  </button>
                ) : (
                  <div className="relative w-full h-[140px] rounded-2xl overflow-hidden border border-borderClient shadow-xs group">
                    <img src={screenshotPreview} alt={t('feedback.alt.screenshot')} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      disabled={isPending}
                      className="absolute top-2 right-2 bg-surface/90 backdrop-blur-md text-danger border border-borderClient w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all hover:bg-danger hover:text-white active:scale-95 disabled:opacity-50"
                      title={t('feedback.actions.remove')}
                    >
                      <HiTrash size={16} />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-3 py-4 text-white font-bold font-heading text-[14px] uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group bg-accent hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:bg-textSecondary disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:transform-none"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  t('feedback.actions.submit')
                )}
              </button>
            </form>
          )}
        </div>
        </>
      )}

      {!isOpen && !isClosing && (
        <button
          type="button"
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-300 shadow-xl border border-borderClient shrink-0 bg-textMain text-surface hover:-translate-y-1 hover:scale-105 hover:bg-accent hover:shadow-[0_10px_20px_-10px_var(--accent-color)] pointer-events-auto active:scale-90"
          onClick={toggleModal}
          aria-label={t('feedback.actions.open')}
        >
          <HiOutlineLightBulb />
        </button>
      )}
    </div>
  );
}