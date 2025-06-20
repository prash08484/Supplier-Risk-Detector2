import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import DashboardContent from './components/DashboardContent';

export default async function Dashboard() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <DashboardContent />;
}