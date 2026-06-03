import { setRequestLocale } from 'next-intl/server';
import { AuthPage } from './login-component/auth-page';

type Props = { params: Promise<{ locale: string }> };

const page = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuthPage />;
};

export default page;
