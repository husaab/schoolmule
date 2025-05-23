'use client'
import LogoutModal from '../../../components/logout/logoutModal';

const DashboardPage = () => {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Welcome to your Dashboard</h1>
      <LogoutModal />
    </div>
  );
};

export default DashboardPage;
