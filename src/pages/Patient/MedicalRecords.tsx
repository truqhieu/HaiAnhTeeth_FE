import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Spinner, Input, Card, CardBody } from "@heroui/react";
import { medicalRecordApi } from "@/api/medicalRecord";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker } from "@/components/Common";
import toast from "react-hot-toast";

interface MedicalRecordItem {
  _id: string;
  appointmentId: string;
  doctorName: string;
  serviceName: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  hasDiagnosis: boolean;
  hasPrescription: boolean;
  prescription?: {
    medicine?: string;
    dosage?: string;
    duration?: string;
  } | null;
  diagnosis?: string | null;
  conclusion?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const MedicalRecords = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MedicalRecordItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<{startDate: string | null, endDate: string | null}>({
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    const loadRecords = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log("🔄 [MedicalRecords] Đang tải danh sách hồ sơ khám bệnh...");
        
        const res = await medicalRecordApi.getPatientMedicalRecordsList();

        if (res.success && res.data) {
          console.log(`✅ [MedicalRecords] Đã tải được ${res.data.length} hồ sơ khám bệnh`);
          setRecords(Array.isArray(res.data) ? res.data : []);
        } else {
          console.error("❌ [MedicalRecords] Lỗi từ API:", res.message);
          setError(res.message || "Không thể tải danh sách hồ sơ");
          setRecords([]); // Đảm bảo records là array rỗng nếu có lỗi
        }
      } catch (e: any) {
        console.error("❌ [MedicalRecords] Lỗi khi tải hồ sơ:", e);
        setError(e.message || "Lỗi kết nối máy chủ");
        setRecords([]); // Đảm bảo records là array rỗng nếu có lỗi
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [isAuthenticated]);

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Filter records dựa trên search criteria
  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    // Filter theo search text (tên bác sĩ hoặc tên dịch vụ)
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter((record) =>
        record.doctorName.toLowerCase().includes(searchLower) ||
        record.serviceName.toLowerCase().includes(searchLower)
      );
    }

    // Filter theo date range
    if (dateRange.startDate && dateRange.endDate) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // Include entire end date
      
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    return filtered;
  }, [records, searchText, dateRange]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600">Vui lòng đăng nhập để xem hồ sơ khám bệnh</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Spinner label="Đang tải hồ sơ..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hồ sơ khám bệnh</h1>
              <p className="mt-1 text-gray-600">
                Xem và quản lý hồ sơ khám bệnh của bạn ({records.length} hồ sơ)
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Tìm kiếm bác sĩ, dịch vụ..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
                isClearable
                onClear={() => setSearchText("")}
                size="lg"
                variant="bordered"
              />

              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onDateChange={(startDate, endDate) => setDateRange({ startDate, endDate })}
                placeholder="Chọn khoảng thời gian"
                className="w-full"
              />
            </div>
          </CardBody>
        </Card>

        {/* All Records List */}
        {filteredRecords.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                Tất cả hồ sơ khám bệnh
                <span className="text-sm font-normal opacity-90">
                  ({filteredRecords.length} {filteredRecords.length === 1 ? "hồ sơ" : "hồ sơ"})
                </span>
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div
                    key={record._id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 cursor-pointer bg-white hover:border-blue-300"
                    onClick={() => navigate(`/patient/medical-record/${record.appointmentId}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {record.serviceName}
                          </h3>
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {formatDate(record.date)}
                          </span>
                          {record.startTime && record.endTime && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {record.startTime} - {record.endTime}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Bác sĩ:</span> {record.doctorName}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {record.hasDiagnosis && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                              ✓ Có chẩn đoán
                            </span>
                          )}
                          {record.hasPrescription && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">
                              💊 Có đơn thuốc
                            </span>
                          )}
                          {record.conclusion && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                              📋 Có kết luận
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patient/medical-record/${record.appointmentId}`);
                        }}
                      >
                        Xem chi tiết →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-lg">
              {searchText.trim() || dateRange.startDate || dateRange.endDate
                ? "Không tìm thấy hồ sơ khám bệnh nào phù hợp với bộ lọc"
                : "Chưa có hồ sơ khám bệnh nào"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecords;