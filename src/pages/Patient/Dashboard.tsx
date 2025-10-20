const Dashboard = () => {
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Bảng điều khiển
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <p className="text-gray-600 text-lg">
            Chào mừng bạn đến với hệ thống quản lý khám bệnh!
          </p>
          <p className="text-gray-500 mt-2">
            Sử dụng menu bên trên để điều hướng đến các chức năng khác nhau.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
