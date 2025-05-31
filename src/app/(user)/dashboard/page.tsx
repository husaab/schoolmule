'use client'

import Navbar from '../../../components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { useUserStore } from '@/store/useUserStore';

const DashboardPage = () => {
  const user = useUserStore((state) => state.user);

  return (
  <>
    <Navbar/>
    <Sidebar />
    <main className = "ml-32 bg-white min-h-screen p-10">
          <div className="py-40 p-50 text-black">
            <h1 className="text-3xl">{user.school} Dashboard</h1>
          </div>
    </main>

  
  
  </>
  );
};

export default DashboardPage;
