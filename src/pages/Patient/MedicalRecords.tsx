import {
  DocumentTextIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const MedicalRecords = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hồ sơ khám bệnh</h1>
          <p className="mt-2 text-gray-600">
            Xem và quản lý hồ sơ khám bệnh của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent Records */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Hồ sơ gần đây
              </h2>
            </div>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-medium text-gray-900">Khám tổng quát</p>
                <p className="text-sm text-gray-600">BS. Nguyễn Văn A</p>
                <p className="text-sm text-gray-500">25/10/2025</p>
                <button className="text-blue-500 text-sm hover:underline mt-1">
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>

          {/* Prescriptions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <ClipboardDocumentListIcon className="w-6 h-6 text-green-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Đơn thuốc</h2>
            </div>
            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <p className="font-medium text-gray-900">Đơn thuốc số #001</p>
                <p className="text-sm text-gray-600">Paracetamol 500mg</p>
                <p className="text-sm text-gray-500">20/10/2025</p>
                <button className="text-green-500 text-sm hover:underline mt-1">
                  Xem đơn thuốc
                </button>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <CalendarIcon className="w-6 h-6 text-purple-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Kết quả xét nghiệm
              </h2>
            </div>
            <div className="space-y-3">
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <p className="font-medium text-gray-900">Xét nghiệm máu</p>
                <p className="text-sm text-gray-600">Kết quả bình thường</p>
                <p className="text-sm text-gray-500">18/10/2025</p>
                <button className="text-purple-500 text-sm hover:underline mt-1">
                  Xem kết quả
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords;
