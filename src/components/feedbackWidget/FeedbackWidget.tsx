import { HiOutlineLightBulb, HiX, HiCamera, HiTrash, HiOutlineGift } from 'react-icons/hi';
import { useFeedbackWidget } from './hooks/useFeedbackWidget';
import type { FeedbackType } from './types';

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
      className="fixed z-[1000] flex flex-col items-end gap-4 pointer-events-none"
      style={{
        bottom: 'max(30px, env(safe-area-inset-bottom))',
        right: 'max(30px, env(safe-area-inset-right))'
      }}
    >
      {showHint && !isOpen && !isClosing && (
        <div className="ui-glass-panel pointer-events-auto p-4 flex items-start gap-3 max-w-[300px] animate-slideUp relative pr-10 shadow-xl border-accent/30">
          <HiOutlineGift className="text-3xl text-accent shrink-0 animate-pulse" />
          <div className="flex flex-col gap-1 text-sm text-textSecondary">
            <strong className="text-textMain font-heading">{t('feedback.hint.title')}</strong>
            <span className="leading-tight">{t('feedback.hint.subtitle')}</span>
          </div>
          <button
            type="button"
            className="absolute top-3 right-3 text-textSecondary hover:text-textMain transition-colors"
            onClick={() => setShowHint(false)}
            aria-label={t('feedback.actions.close')}
          >
            <HiX />
          </button>
        </div>
      )}

      {(isOpen || isClosing) && (
        <div className={`
          ui-glass-panel pointer-events-auto w-[min(calc(100vw-40px),380px)] overflow-hidden shadow-2xl origin-bottom-right transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isClosing ? 'opacity-0 scale-90 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}
        `}>
          <button
            type="button"
            onClick={toggleModal}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface border border-borderClient flex items-center justify-center text-textSecondary hover:text-danger hover:border-danger transition-colors z-10 shadow-sm"
            aria-label={t('feedback.actions.close')}
          >
            <HiX className="text-lg" />
          </button>

          <div className="bg-surface p-6 pb-2 border-b border-borderClient pr-14">
            <h3 className="font-heading font-bold text-lg text-textMain mb-1">{t('feedback.modal.title')}</h3>
            <p className="text-sm text-textSecondary leading-snug">{t('feedback.modal.subtitle')}</p>
          </div>

          {sent ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <div className="text-5xl animate-bounce">✨</div>
              <h4 className="font-bold text-success text-lg">{t('feedback.modal.success_title')}</h4>
              <p className="text-sm text-textSecondary">{t('feedback.modal.success_desc')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              {errorMsg && (
                <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm font-medium text-center">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-textMain">{t('feedback.fields.type_label')}</label>
                <select
                  value={formData.type}
                  onChange={e => updateType(e.target.value as FeedbackType)}
                  className="ui-input py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                  disabled={isPending}
                >
                  <option value="critical">{t('feedback.types.critical')}</option>
                  <option value="data_error">{t('feedback.types.data_error')}</option>
                  <option value="ui_bug">{t('feedback.types.ui_bug')}</option>
                  <option value="suggestion">{t('feedback.types.suggestion')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-textMain">{t('feedback.fields.description_label')}</label>
                <textarea
                  placeholder={t('feedback.fields.description_placeholder')}
                  value={formData.message}
                  onChange={e => updateMessage(e.target.value)}
                  className="ui-input py-3 text-sm h-[120px] resize-none focus:ring-2 focus:ring-accent/20 outline-none"
                  disabled={isPending}
                />
              </div>

              <div className="w-full">
                {!screenshotPreview ? (
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={isCapturing || isPending}
                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-borderClient text-textSecondary font-medium hover:border-accent hover:text-accent hover:bg-accent/5 transition-all disabled:opacity-50"
                  >
                    <HiCamera className="text-xl" />
                    {isCapturing ? t('feedback.actions.capturing') : t('feedback.actions.capture')}
                  </button>
                ) : (
                  <div className="relative w-full h-[140px] rounded-xl overflow-hidden border border-borderClient shadow-sm group">
                    <img src={screenshotPreview} alt={t('feedback.alt.screenshot')} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      disabled={isPending}
                      className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      <HiTrash size={16} /> {t('feedback.actions.remove')}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#0f1014] text-white font-bold py-3.5 rounded-xl mt-2 hover:bg-accent hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md disabled:opacity-70 disabled:hover:transform-none flex items-center justify-center"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
                ) : (
                  t('feedback.actions.submit')
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {!isOpen && !isClosing && (
        <button
          type="button"
          className="w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all duration-300 shadow-xl border border-white/10 shrink-0 bg-textMain text-surface hover:-translate-y-1 hover:scale-105 hover:bg-accent hover:shadow-accent/30 pointer-events-auto active:scale-90"
          onClick={toggleModal}
          aria-label={t('feedback.actions.open')}
        >
          <HiOutlineLightBulb />
        </button>
      )}
    </div>
  );
}