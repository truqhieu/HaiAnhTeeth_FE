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
  appointmentType?: "FollowUp" | "Consultation" | "WalkIn" | string;
  followUpOfAppointmentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GroupedMedicalRecord {
  groupKey: string;
  baseRecord: MedicalRecordItem;
  followUps: MedicalRecordItem[];
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
      filtered = filtered.filter((record) => {
        const matchesBasic =
          record.doctorName.toLowerCase().includes(searchLower) ||
          record.serviceName.toLowerCase().includes(searchLower);
        const dateVi = record.date
          ? new Date(record.date).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).toLowerCase()
          : "";
        const matchesDate = dateVi.includes(searchLower);
        return matchesBasic || matchesDate;
      });
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

    // Sort by date descending (mới nhất lên đầu)
    filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.date ? new Date(b.date).getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending: mới nhất lên đầu
    });

    return filtered;
  }, [records, searchText, dateRange]);

  const recordLookupByAppointmentId = useMemo(() => {
    const map = new Map<string, MedicalRecordItem>();
    records.forEach((record) => {
      if (record.appointmentId) {
        map.set(record.appointmentId, record);
      }
    });
    return map;
  }, [records]);

  const recordLookupById = useMemo(() => {
    const map = new Map<string, MedicalRecordItem>();
    records.forEach((record) => {
      if (record._id) {
        map.set(record._id, record);
      }
    });
    return map;
  }, [records]);

  const groupedRecords = useMemo(() => {
    const groups = new Map<string, { base?: MedicalRecordItem; followUps: MedicalRecordItem[] }>();

    const resolveGroupKey = (record: MedicalRecordItem) => {
      let current: MedicalRecordItem | undefined = record;
      const visited = new Set<string>();

      while (
        current?.appointmentType === "FollowUp" &&
        current.followUpOfAppointmentId &&
        !visited.has(current.followUpOfAppointmentId)
      ) {
        visited.add(current.followUpOfAppointmentId);
        const parent: MedicalRecordItem | undefined =
          recordLookupByAppointmentId.get(current.followUpOfAppointmentId) ||
          recordLookupById.get(current.followUpOfAppointmentId);

        if (!parent) {
          return {
            rootKey: current.followUpOfAppointmentId,
            baseRecord:
              recordLookupByAppointmentId.get(current.followUpOfAppointmentId) ||
              recordLookupById.get(current.followUpOfAppointmentId),
          };
        }

        current = parent;
      }

      return {
        rootKey: current?.appointmentId || current?._id || record._id,
        baseRecord: current,
      };
    };

    filteredRecords.forEach((record) => {
      const isFollowUp = record.appointmentType === "FollowUp" && record.followUpOfAppointmentId;
      const { rootKey, baseRecord } = resolveGroupKey(record);
      const groupKey = rootKey;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, { base: baseRecord, followUps: [] });
      }

      const group = groups.get(groupKey)!;

      if (isFollowUp) {
        if (!group.base && baseRecord) {
          group.base = baseRecord;
        }
        group.followUps.push(record);
      } else {
        group.base = record;
      }
    });

    return Array.from(groups.entries())
      .map(([groupKey, group]) => {
        const baseRecord =
          group.base ||
          recordLookupByAppointmentId.get(groupKey) ||
          recordLookupById.get(groupKey) ||
          group.followUps[0];

        const followUps = [...group.followUps].sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : new Date(a.createdAt).getTime();
          const dateB = b.date ? new Date(b.date).getTime() : new Date(b.createdAt).getTime();
          return dateA - dateB;
        });

        return {
          groupKey,
          baseRecord: baseRecord || (group.followUps.length > 0 ? group.followUps[0] : filteredRecords[0]),
          followUps,
        } as GroupedMedicalRecord;
      })
      .filter((group): group is GroupedMedicalRecord => Boolean(group.baseRecord))
      .sort((a, b) => {
        const dateA = a.baseRecord.date
          ? new Date(a.baseRecord.date).getTime()
          : new Date(a.baseRecord.createdAt).getTime();
        const dateB = b.baseRecord.date
          ? new Date(b.baseRecord.date).getTime()
          : new Date(b.baseRecord.createdAt).getTime();
        return dateB - dateA;
      });
  }, [filteredRecords, recordLookupByAppointmentId, recordLookupById]);

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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#39BDCC] to-[#2ca6b5] flex items-center justify-center">
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
        {groupedRecords.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                Tất cả hồ sơ khám bệnh
                <span className="text-sm font-normal opacity-90">
                  ({groupedRecords.length} {groupedRecords.length === 1 ? "hồ sơ" : "hồ sơ"})
                </span>
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {groupedRecords.map(({ groupKey, baseRecord, followUps }) => {
                  return (
                    <div
                      key={groupKey}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 bg-white"
                    >
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => baseRecord.appointmentId && navigate(`/patient/medical-record/${baseRecord.appointmentId}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {/* <h3 className="text-lg font-semibold text-gray-900">
                              {baseRecord.serviceName}
                            </h3> */}
                            {/* <span className="text-xs uppercase tracking-wide font-semibold px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                              {isBaseFollowUp ? "Tái khám" : "Ca khám gốc"}
                            </span> */}
                            {followUps.length > 0 && (
                              <span className="text-xs font-semibold px-2 py-1 rounded-md bg-[#39BDCC]/10 text-[#2ca6b5]">
                                {followUps.length} lần tái khám
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarIcon className="w-4 h-4 text-[#39BDCC]" />
                              <span className="font-medium text-gray-700">Ngày khám:</span>
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#39BDCC] text-white">
                                {formatDate(baseRecord.date || baseRecord.createdAt)}
                              </span>
                            </div>
                            {baseRecord.startTime && baseRecord.endTime && (
                              <div className="flex items-center gap-2 text-sm">
                                <ClockIcon className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-700">Giờ khám:</span>
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700">
                                  {baseRecord.startTime} - {baseRecord.endTime}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-700">Bác sĩ:</span>
                              <span className="text-gray-900">{baseRecord.doctorName}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          className="ml-4 px-4 py-2 text-sm font-medium text-[#39BDCC] hover:text-[#2ca6b5] hover:bg-[#39BDCC]/10 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (baseRecord.appointmentId) {
                              navigate(`/patient/medical-record/${baseRecord.appointmentId}`);
                            }
                          }}
                        >
                          Xem chi tiết →
                        </button>
                      </div>

                      {followUps.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-dashed border-gray-200">
                          <p className="text-sm font-semibold text-[#39BDCC] uppercase tracking-wide mb-3">
                            Các lần tái khám
                          </p>
                          <div className="space-y-3">
                            {followUps.map((followUp, index) => (
                              <div
                                key={followUp._id}
                                className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                              >
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-900">
                                      Tái khám lần {index + 1}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#39BDCC]/10 text-[#2ca6b5]">
                                      {formatDate(followUp.date || followUp.createdAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-700 flex-wrap">
                                    {followUp.startTime && followUp.endTime && (
                                      <span>
                                        ⏰ {followUp.startTime} - {followUp.endTime}
                                      </span>
                                    )}
                                    <span>👨‍⚕️ {followUp.doctorName}</span>
                                  </div>
                                </div>
                                <button
                                  className="self-start md:self-auto px-3 py-2 text-sm font-medium text-[#39BDCC] hover:text-[#2ca6b5] rounded-lg transition-colors"
                                  onClick={() =>
                                    followUp.appointmentId &&
                                    navigate(`/patient/medical-record/${followUp.appointmentId}`)
                                  }
                                >
                                  Xem chi tiết →
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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