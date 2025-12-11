import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
} from "@heroui/react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface Policy {
  _id: string;
  title: string;
  description: string;
  active: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  type: string;
  serviceName: string;
  doctorName: string;
  startTime: string;
  endTime: string;
  status: string;
}

// Danh sách ngân hàng Việt Nam
const BANKS = [
  { id: "vietcombank", name: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)" },
  { id: "agribank", name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)" },
  { id: "bidv", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)" },
  { id: "vietinbank", name: "Ngân hàng TMCP Công thương Việt Nam (VietinBank)" },
  { id: "techcombank", name: "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)" },
  { id: "mbbank", name: "Ngân hàng TMCP Quân đội (MB Bank)" },
  { id: "acb", name: "Ngân hàng TMCP Á Châu (ACB)" },
  { id: "vpb", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)" },
  { id: "tpb", name: "Ngân hàng TMCP Tiên Phong (TPBank)" },
  { id: "hdbank", name: "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh (HDBank)" },
  { id: "vib", name: "Ngân hàng TMCP Quốc tế Việt Nam (VIB)" },
  { id: "scb", name: "Ngân hàng TMCP Sài Gòn (SCB)" },
  { id: "eximbank", name: "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam (Eximbank)" },
  { id: "shb", name: "Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)" },
  { id: "ocb", name: "Ngân hàng TMCP Phương Đông (OCB)" },
  { id: "msb", name: "Ngân hàng TMCP Hàng Hải (MSB)" },
  { id: "vab", name: "Ngân hàng TMCP Việt Á (VietABank)" },
  { id: "ncb", name: "Ngân hàng TMCP Quốc Dân (NCB)" },
  { id: "oceanbank", name: "Ngân hàng Thương mại TNHH MTV Đại Dương (OceanBank)" },
  { id: "pvb", name: "Ngân hàng TMCP Đại Chúng Việt Nam (PVcomBank)" },
  { id: "gpbank", name: "Ngân hàng TMCP Dầu Khí Toàn Cầu (GPBank)" },
  { id: "abbank", name: "Ngân hàng TMCP An Bình (ABBank)" },
  { id: "vrb", name: "Ngân hàng Liên doanh Việt - Nga (VRB)" },
  { id: "other", name: "Ngân hàng khác" }
];

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  policies: Policy[];
  refundData: {
    isEligibleForRefund: boolean;
    hoursUntilAppointment: number | null;
    cancellationThresholdHours: number;
    refundMessage: string;
    requiresBankInfo: boolean;
  } | null; // ⭐ Thêm refundData từ backend
  onConfirmCancel: (
    confirmed: boolean,
    cancelReason?: string,
    bankInfo?: {
      accountHolderName: string;
      accountNumber: string;
      bankName: string;
    }
  ) => void;
}

const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  policies,
  refundData, // ⭐ Nhận refundData từ backend
  onConfirmCancel
}) => {
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: ""
  });
  const [bankErrors, setBankErrors] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
  });
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [showBankSuggestions, setShowBankSuggestions] = useState(false);
  const [filteredBanks, setFilteredBanks] = useState(BANKS);

  const filterBanks = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredBanks(BANKS);
      return;
    }
    
    const filtered = BANKS.filter(bank => 
      bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBanks(filtered);
  };

  const handleBankInputChange = (value: string) => {
    setBankInfo(prev => ({ ...prev, bankName: value }));
    filterBanks(value);
    setShowBankSuggestions(true);
    
    // Clear error khi bắt đầu nhập
    if (bankErrors.bankName) {
      setBankErrors(prev => ({ ...prev, bankName: "" }));
    }
  };

  const selectBank = (bank: typeof BANKS[0]) => {
    setBankInfo(prev => ({ 
      ...prev, 
      bankName: bank.name 
    }));
    setShowBankSuggestions(false);
    setBankErrors(prev => ({ ...prev, bankName: "" }));
  };

  // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
  const normalizeText = (text: string): string => {
    return text.trim().replace(/\s+/g, ' ');
  };

  const validateBankFields = () => {
    const errors = { accountHolderName: "", accountNumber: "", bankName: "" } as typeof bankErrors;
    if (!bankInfo.accountHolderName.trim()) {
      errors.accountHolderName = "Vui lòng nhập tên chủ tài khoản";
    }
    const number = bankInfo.accountNumber.trim();
    if (!number) {
      errors.accountNumber = "Vui lòng nhập số tài khoản";
    } else if (!/^[0-9]+$/.test(number)) {
      errors.accountNumber = "Số tài khoản chỉ được chứa số";
    } else if (number.length < 8 || number.length > 20) {
      errors.accountNumber = "Số tài khoản phải từ 8-20 chữ số";
    }
    if (!bankInfo.bankName.trim()) {
      errors.bankName = "Vui lòng chọn ngân hàng";
    }
    setBankErrors(errors);
    return errors;
  };

  const handleConfirm = async () => {
    // ⭐ Sử dụng refundData từ backend thay vì tính toán ở frontend
    const canRefund = refundData?.isEligibleForRefund || false;
    
    // Validation cho thông tin ngân hàng khi được hoàn tiền
    if (canRefund) {
      const errors = validateBankFields();
      if (errors.accountHolderName || errors.accountNumber || errors.bankName) {
        return; // Validation errors đã được hiển thị
      }
    }

    setIsSubmitting(true);
    try {
      // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
      const normalizedCancelReason = normalizeText(cancelReason);
      const bankInfoToSend = canRefund ? {
        accountHolderName: normalizeText(bankInfo.accountHolderName),
        accountNumber: bankInfo.accountNumber.trim(),
        bankName: normalizeText(bankInfo.bankName),
      } : undefined;
      await onConfirmCancel(true, normalizedCancelReason, bankInfoToSend);
      setCancelReason('');
      setBankInfo({ accountHolderName: "", accountNumber: "", bankName: "" });
      setBankErrors({ accountHolderName: "", accountNumber: "", bankName: "" });
      setIsBankDropdownOpen(false);
      setShowBankSuggestions(false);
      setFilteredBanks(BANKS);
    } catch (error) {
      console.error("Error confirming cancellation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onConfirmCancel(false);
    setCancelReason("");
    setBankInfo({ accountHolderName: "", accountNumber: "", bankName: "" });
    setBankErrors({ accountHolderName: "", accountNumber: "", bankName: "" });
    setIsBankDropdownOpen(false);
    setShowBankSuggestions(false);
    setFilteredBanks(BANKS);
    onClose();
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);

    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ⭐ Sử dụng refundData từ backend thay vì tính toán ở frontend
  const getRefundStatus = () => {
    console.log('🔍 [Modal] getRefundStatus called');
    console.log('🔍 [Modal] refundData:', refundData);
    
    if (!refundData) {
      console.log('⚠️ [Modal] refundData is null/undefined!');
      return { canRefund: false, hoursLeft: 0, threshold: 24 };
    }
    
    console.log('✅ [Modal] Using refundData from backend:', {
      isEligibleForRefund: refundData.isEligibleForRefund,
      hoursUntilAppointment: refundData.hoursUntilAppointment,
      threshold: refundData.cancellationThresholdHours
    });
    
    const result = {
      canRefund: refundData.isEligibleForRefund,
      hoursLeft: refundData.hoursUntilAppointment || 0,
      threshold: refundData.cancellationThresholdHours
    };
    
    console.log('✅ [Modal] Calculated refundStatus:', result);
    
    return result;
  };

  // ⭐ Tính lại refundStatus mỗi khi refundData thay đổi
  const refundStatus = React.useMemo(() => {
    console.log('🔄 [Modal] useMemo triggered, recalculating refundStatus');
    const status = getRefundStatus();
    console.log('🔄 [Modal] Final refundStatus:', status);
    return status;
  }, [refundData]);

  console.log('🎨 [Modal] Rendering with refundStatus:', refundStatus);
  console.log('🎨 [Modal] Policies:', policies);

  if (!appointment) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
        body: "py-6",
        header: "pb-2"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-warning" />
            <span className="text-lg font-semibold">Xác nhận hủy lịch tư vấn</span>
          </div>
        </ModalHeader>
        
        <ModalBody 
          className="space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Thông tin lịch hẹn */}
          <Card className="bg-warning-50 border-warning-200 overflow-visible">
            <CardHeader className="pb-1">
              <h3 className="text-sm font-medium text-warning-800">Thông tin lịch hẹn</h3>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Dịch vụ:</span>
                  <span className="font-medium text-right max-w-[60%] break-words">{appointment.serviceName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bác sĩ:</span>
                  <span className="font-medium text-right max-w-[60%] break-words">{appointment.doctorName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-medium text-right max-w-[60%] break-words">
                    {formatDateTime(appointment.startTime)} - {formatDateTime(appointment.endTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trạng thái:</span>
                  <Chip 
                    size="sm" 
                    color={appointment.status === 'Approved' ? 'success' : 'warning'}
                    variant="flat"
                  >
                    {appointment.status === 'Approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* ⭐ CHỈ hiển thị policies từ DB khi KHÔNG đủ điều kiện hoàn tiền */}
          {!refundStatus.canRefund && policies && policies.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-800">Chính sách hủy lịch</h3>
              <div className="space-y-1">
                {policies.map((policy) => (
                  <Card key={policy._id} className="bg-orange-50 border-orange-200">
                    <CardBody className="py-3">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-orange-800 leading-tight">
                          {policy.title}
                        </h4>
                        <p className="text-xs text-orange-700 leading-relaxed break-words">
                          {policy.description}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Thông tin ngân hàng - chỉ hiển thị khi được hoàn tiền */}
          {refundStatus.canRefund && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-800">Thông tin hoàn tiền</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Tên chủ tài khoản <span className="text-red-500">*</span>
                  </label>
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={bankInfo.accountHolderName}
                      onChange={(e) => setBankInfo(prev => ({ ...prev, accountHolderName: e.target.value }))}
                      onBlur={() => {
                        setBankErrors((prev) => ({
                          ...prev,
                          accountHolderName: bankInfo.accountHolderName.trim() ? "" : "Vui lòng nhập tên chủ tài khoản",
                        }));
                      }}
                      placeholder="Nhập tên chủ tài khoản"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      aria-label="Tên chủ tài khoản"
                      required
                    />
                  </div>
                  {bankErrors.accountHolderName && (
                    <p className="text-xs text-red-600">{bankErrors.accountHolderName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Số tài khoản <span className="text-red-500">*</span>
                  </label>
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={bankInfo.accountNumber}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Chỉ cho phép nhập số
                        if (/^[0-9]*$/.test(value)) {
                          setBankInfo(prev => ({ ...prev, accountNumber: value }));
                        }
                      }}
                      onBlur={() => {
                        const errors = validateBankFields();
                        setBankErrors((prev) => ({ ...prev, accountNumber: errors.accountNumber }));
                      }}
                      placeholder="Nhập số tài khoản (8-20 chữ số)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      aria-label="Số tài khoản"
                      maxLength={20}
                      required
                    />
                  </div>
                  {bankErrors.accountNumber && (
                    <p className="text-xs text-red-600">{bankErrors.accountNumber}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-gray-700">
                    Ngân hàng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bankInfo.bankName}
                      onChange={(e) => handleBankInputChange(e.target.value)}
                      onFocus={() => setShowBankSuggestions(true)}
                      onBlur={() => {
                        // Delay để cho phép click vào suggestion
                        setTimeout(() => {
                          setShowBankSuggestions(false);
                          if (!bankInfo.bankName.trim()) {
                            setBankErrors((prev) => ({
                              ...prev,
                              bankName: "Vui lòng chọn ngân hàng",
                            }));
                          }
                        }, 200);
                      }}
                      placeholder="Nhập tên ngân hàng (VD: MB, Vietcombank...)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      aria-label="Chọn ngân hàng"
                      autoComplete="off"
                    />
                    
                    {/* Dropdown suggestions */}
                    {showBankSuggestions && filteredBanks.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredBanks.map((bank) => (
                          <div
                            key={bank.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectBank(bank);
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div className="font-medium text-gray-900">{bank.name}</div>
                            <div className="text-xs text-gray-500">{bank.id}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {bankErrors.bankName && (
                    <p className="text-xs text-red-600">{bankErrors.bankName}</p>
                  )}
                </div>
              <div className="bg-blue-50 border border-gray-200 rounded-md p-3">
                <p className="text-xs text-blue-700">
                  <strong>Lưu ý:</strong> Thông tin ngân hàng sẽ được sử dụng để hoàn tiền. 
                  Vui lòng kiểm tra kỹ thông tin trước khi xác nhận hủy lịch.
                </p>
              </div>
            </div>
          )}

          {/* Bỏ input Lý do hủy lịch theo yêu cầu */}

        </ModalBody>

        <ModalFooter className="gap-2">
          <Button
            variant="light"
            onPress={handleCancel}
            disabled={isSubmitting}
            className="text-gray-600"
          >
            Không hủy
          </Button>
          <Button
            color={refundStatus.canRefund ? "primary" : "danger"}
            onPress={handleConfirm}
            isLoading={isSubmitting}
            startContent={!isSubmitting && <XMarkIcon className="h-4 w-4" />}
            className="font-medium"
          >
            {isSubmitting 
              ? 'Đang xử lý...' 
              : 'Xác nhận hủy lịch'
            }
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CancelAppointmentModal;
