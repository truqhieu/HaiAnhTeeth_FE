import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Spinner,
  Chip,
  Pagination,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  SparklesIcon,
  TagIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { promotionApi, Promotion } from "@/api/promotion";

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [discountFilter, setDiscountFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;

  const discountTypes = [
    { value: "all", label: "Tất cả loại giảm giá" },
    { value: "Percent", label: "Giảm theo phần trăm" },
    { value: "Fix", label: "Giảm cố định" },
  ];

  useEffect(() => {
    fetchPromotions();
  }, [discountFilter, currentPage]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchPromotions();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        status: "Active", // Chỉ lấy promotion đang active
        sort: "desc",
      };

      if (discountFilter !== "all") {
        params.discountType = discountFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await promotionApi.getPublicPromotions(params);

      if (response.success && response.data) {
        setPromotions(response.data);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error("❌ Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusChip = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (now < startDate) {
      return (
        <Chip color="warning" size="sm" variant="flat">
          Sắp diễn ra
        </Chip>
      );
    } else if (now > endDate) {
      return (
        <Chip color="danger" size="sm" variant="flat">
          Đã kết thúc
        </Chip>
      );
    } else {
      return (
        <Chip color="success" size="sm" variant="flat" startContent={<SparklesIcon className="w-3 h-3" />}>
          Đang diễn ra
        </Chip>
      );
    }
  };

  const getDiscountDisplay = (promotion: Promotion) => {
    if (promotion.discountType === "Percent") {
      return `Giảm ${promotion.discountValue}%`;
    } else {
      return `Giảm ${promotion.discountValue.toLocaleString("vi-VN")}đ`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <SparklesIcon className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Ưu đãi đặc biệt
            </h1>
          </div>
          <p className="text-xl text-white/90">
            Khám phá các chương trình ưu đãi hấp dẫn dành cho bạn
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <Card className="shadow-xl border-0">
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <Input
                placeholder="Tìm kiếm ưu đãi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2" />
                }
                classNames={{
                  input: "text-base",
                  inputWrapper:
                    "border-2 border-gray-200 hover:border-[#39BDCC] data-[focus=true]:border-[#39BDCC] h-14 bg-default-100",
                }}
              />

              {/* Discount Type Filter */}
              <Select
                placeholder="Lọc theo loại giảm giá"
                selectedKeys={[discountFilter]}
                onChange={(e) => {
                  setDiscountFilter(e.target.value);
                  setCurrentPage(1);
                }}
                classNames={{
                  trigger:
                    "border-2 border-gray-200 hover:border-[#39BDCC] data-[focus=true]:border-[#39BDCC] h-14 bg-default-100",
                  value: "text-base",
                }}
              >
                {discountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Promotions List */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" label="Đang tải ưu đãi..." />
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-20">
            <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">Không tìm thấy ưu đãi nào</p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Tìm thấy <span className="font-semibold text-[#39BDCC]">{total}</span> ưu đãi
              </p>
            </div>

            {/* Promotions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promotion) => (
                <Card
                  key={promotion._id}
                  className="hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#39BDCC]"
                >
                  <CardBody className="p-6">
                    {/* Header with status */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                          {promotion.title}
                        </h3>
                      </div>
                      {getStatusChip(promotion)}
                    </div>

                    {/* Discount Badge */}
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                        <TagIcon className="w-5 h-5" />
                        {getDiscountDisplay(promotion)}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {promotion.description}
                    </p>

                    {/* Applicable Services */}
                    {promotion.applyToAll ? (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-blue-700">
                          ✨ Áp dụng cho tất cả dịch vụ
                        </p>
                      </div>
                    ) : (
                      promotion.services && promotion.services.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-500 mb-2">
                            Áp dụng cho:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {promotion.services.slice(0, 3).map((service: any, idx: number) => (
                              <Chip key={idx} size="sm" variant="flat" color="primary">
                                {typeof service === 'object' && service?.serviceName
                                  ? service.serviceName
                                  : `Dịch vụ ${idx + 1}`}
                              </Chip>
                            ))}
                            {promotion.services.length > 3 && (
                              <Chip size="sm" variant="flat" color="default">
                                +{promotion.services.length - 3} dịch vụ
                              </Chip>
                            )}
                          </div>
                        </div>
                      )
                    )}

                    {/* Date Range */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="font-medium">Bắt đầu:</span>
                        <span>{formatDate(promotion.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4" />
                        <span className="font-medium">Kết thúc:</span>
                        <span>{formatDate(promotion.endDate)}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <Pagination
                  total={totalPages}
                  page={currentPage}
                  onChange={setCurrentPage}
                  showControls
                  color="primary"
                  size="lg"
                  classNames={{
                    wrapper: "gap-2",
                    item: "w-10 h-10 text-base",
                    cursor: "bg-[#39BDCC] text-white font-semibold",
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PromotionsPage;


