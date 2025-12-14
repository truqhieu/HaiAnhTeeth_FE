import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Chip,
  Spinner,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Service, serviceApi } from "@/api/service";
import { useBookingModal } from "@/contexts/BookingModalContext";

export default function ServicesPage() {
  const { openBookingModal } = useBookingModal();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categoryOptions = [
    { value: "all", label: "Tất cả hình thức" },
    { value: "Examination", label: "Khám" },
    { value: "Consultation", label: "Tư vấn" },
  ];

  useEffect(() => {
    fetchServices();
  }, [selectedCategory]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params: any = {
        status: "Active",
        limit: 100,
        minPrice: 0,
      };

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      const data = await serviceApi.getPublicServices(params);

      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.error("❌ [Services] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) =>
    service.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-gray-600">Đang tải dịch vụ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Dịch Vụ Nha Khoa
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Chúng tôi cung cấp đa dạng các dịch vụ chăm sóc răng miệng với
              chất lượng hàng đầu
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <Card className="shadow-xl border-0">
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <Input
                placeholder="Tìm kiếm dịch vụ..."
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

              {/* Category Filter */}
              <Select
                placeholder="Lọc theo hình thức khám"
                selectedKeys={[selectedCategory]}
                onChange={(e) => setSelectedCategory(e.target.value)}
                classNames={{
                  trigger:
                    "border-2 border-gray-200 hover:border-[#39BDCC] data-[focus=true]:border-[#39BDCC] h-14 bg-default-100",
                  value: "text-base",
                }}
              >
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Không tìm thấy dịch vụ
            </h3>
            <p className="text-gray-600">
              Vui lòng thử lại với từ khóa hoặc bộ lọc khác
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Tất cả dịch vụ
                <span className="text-[#39BDCC] ml-2">
                  ({filteredServices.length})
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <Card
                  key={service._id}
                  className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-[#39BDCC]/30 h-full"
                >
                  <CardBody className="p-4 flex flex-col h-full">
                    {/* Header with badges */}
                    <div className="flex justify-between items-start gap-2 mb-2 min-h-[52px]">
                      <h3 className="text-base font-bold text-gray-900 line-clamp-2 flex-1 leading-snug">
                        {service.serviceName}
                      </h3>
                      {service.hasPromotion && (
                        <Chip
                          color="danger"
                          size="sm"
                          variant="flat"
                          startContent={
                            <SparklesIcon className="w-3 h-3" />
                          }
                          className="flex-shrink-0 text-xs"
                        >
                          Giảm giá
                        </Chip>
                      )}
                    </div>


                    {/* Description */}
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2 min-h-[32px] leading-relaxed">
                      {service.description}
                    </p>

                    {/* Spacer to push content down */}
                    <div className="flex-grow"></div>

                    {/* Price Section */}
                    <div className="mb-2 p-2.5 bg-gradient-to-br from-[#39BDCC]/5 to-[#39BDCC]/10 rounded-lg border border-[#39BDCC]/20 min-h-[70px] flex items-center">
                      {service.hasPromotion ? (
                        <div className="space-y-1 w-full">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500 line-through text-xs">
                              {service.originalPrice?.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <CurrencyDollarIcon className="w-4 h-4 text-[#39BDCC] flex-shrink-0" />
                            <span className="text-[#39BDCC] font-bold text-lg">
                              {service.finalPrice?.toLocaleString("vi-VN")}
                            </span>
                            <span className="text-[#39BDCC] font-semibold text-sm">
                              đ
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Chip
                              color="success"
                              size="sm"
                              variant="flat"
                              className="text-[10px] h-5"
                            >
                              Tiết kiệm {service.discountAmount?.toLocaleString("vi-VN")}đ
                            </Chip>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5 w-full">
                          <CurrencyDollarIcon className="w-4 h-4 text-[#39BDCC] flex-shrink-0" />
                          <span className="text-[#39BDCC] font-bold text-lg">
                            {service.price.toLocaleString("vi-VN")}
                          </span>
                          <span className="text-[#39BDCC] font-semibold text-sm">
                            đ
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info Footer */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{service.durationMinutes} phút</span>
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={service.isPrepaid ? "primary" : "default"}
                          className="flex-shrink-0 text-xs h-5"
                        >
                          {service.isPrepaid ? "Trả trước" : "Trả sau"}
                        </Chip>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white py-16 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bạn cần tư vấn thêm?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Đội ngũ chuyên gia của chúng tôi sẵn sàng hỗ trợ bạn
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-[#39BDCC] hover:bg-gray-100 font-semibold shadow-lg text-base px-8"
              onClick={openBookingModal}
            >
              Đặt lịch khám
            </Button>
            <Button
              size="lg"
              variant="bordered"
              className="border-2 border-white text-white hover:bg-white/10 font-semibold text-base px-8"
              as="a"
              href="tel:02473008866"
            >
              Gọi ngay: 024 7300 8866
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

