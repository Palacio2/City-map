import { FaGoogle } from 'react-icons/fa';

interface SocialLoginButtonProps {
  provider: 'google';
  onClick: (provider: 'google') => void;
  disabled?: boolean;
  text: string;
}

export const SocialLoginButton = ({ provider, onClick, disabled, text }: SocialLoginButtonProps) => {
  return (
    <button 
      type="button"
      onClick={() => onClick(provider)} 
      disabled={disabled} 
      className="w-full py-4 border-2 border-borderClient rounded-2xl font-bold flex items-center justify-center gap-3 hover:border-accent hover:bg-body transition-all text-textMain text-[14px]"
    >
      <FaGoogle className="text-accent text-[1.2rem]" /> 
      {text}
    </button>
  );
};
