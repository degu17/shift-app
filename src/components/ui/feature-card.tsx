import Link from 'next/link';

/**
 * 機能カードのプロパティ
 */
interface FeatureCardProps {
  href?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  isDisabled?: boolean;
}

/**
 * 機能カードコンポーネント
 * ホームページで使用される機能への導線カード
 */
export default function FeatureCard({
  href,
  title,
  description,
  icon,
  iconColor,
  isDisabled = false
}: FeatureCardProps) {
  const cardContent = (
    <div className={`rounded-lg shadow-md p-6 h-full transition-shadow ${
      isDisabled 
        ? 'bg-gray-100 opacity-75' 
        : 'bg-white hover:shadow-lg'
    }`}>
      <div className={`mb-6 flex justify-center ${
        isDisabled ? 'text-gray-400' : iconColor
      }`}>
        {icon}
      </div>
      <h3 className={`text-lg font-semibold mb-3 text-center ${
        isDisabled ? 'text-gray-500' : 'text-gray-900'
      }`}>
        {title}
      </h3>
      <p className={`text-center text-sm leading-relaxed ${
        isDisabled ? 'text-gray-500' : 'text-gray-600'
      }`}>
        {description}
      </p>
    </div>
  );

  if (isDisabled || !href) {
    return <div className="block w-72">{cardContent}</div>;
  }

  return (
    <Link href={href} className="block w-72">
      {cardContent}
    </Link>
  );
} 