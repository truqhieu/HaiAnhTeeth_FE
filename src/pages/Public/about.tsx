import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Button,
  Divider,
} from "@heroui/react";
import {
  InformationCircleIcon,
  SparklesIcon,
  HeartIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

import { introductionApi, type Introduction } from "@/api/introduction";
import { title } from "@/components/Common/primitives";
import ConsultationFormModal from "@/components/Common/ConsultationFormModal";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function AboutPage() {
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  useEffect(() => {
    const fetchIntroductions = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await introductionApi.getPublicIntroductions({
          limit: 6,
          status: "Published",
          sort: "desc",
        });
        if (res.success && Array.isArray(res.data)) {
          setIntroductions(res.data);
        } else {
          setIntroductions([]);
        }
      } catch (err: any) {
        console.error("Lỗi tải giới thiệu:", err);
        setError(err.message || "Không thể tải nội dung giới thiệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchIntroductions();
  }, []);

  const heroIntroduction = introductions[selectedIndex];

  const stats = [
    { label: "Năm kinh nghiệm", value: "12+" },
    { label: "Bác sĩ & chuyên gia", value: "30+" },
    { label: "Khách hàng hài lòng", value: "10.000+" },
    { label: "Chi nhánh & phòng khám", value: "05" },
  ];

  const values = [
    {
      icon: SparklesIcon,
      title: "Công nghệ tiên phong",
      desc: "Ứng dụng thiết bị chuẩn quốc tế, đảm bảo độ chính xác và an toàn tuyệt đối.",
    },
    {
      icon: HeartIcon,
      title: "Chăm sóc tận tâm",
      desc: "Đặt trải nghiệm khách hàng làm trọng tâm, hướng đến cảm giác thoải mái nhất.",
    },
    {
      icon: AcademicCapIcon,
      title: "Đội ngũ chuyên gia",
      desc: "Tập hợp bác sĩ đầu ngành, thường xuyên tham gia đào tạo trong & ngoài nước.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Minh bạch & trách nhiệm",
      desc: "Mọi liệu trình đều được tư vấn rõ ràng, bảo hành với cam kết dài hạn.",
    },
  ];

  const timeline = useMemo(() => {
    return introductions.map((item, idx) => ({
      ...item,
      order: introductions.length - idx,
    }));
  }, [introductions]);

  return (
    <section className="min-h-screen bg-gradient-to-b from-white via-[#f5fdfe] to-[#dff7fb]">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-16">
        {/* Hero */}
        <HeroSection 
          title={title}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          loading={loading}
          error={error}
          heroIntroduction={heroIntroduction}
          introductions={introductions}
          formatDate={formatDate}
        />

        {/* Stats */}
        <StatsSection stats={stats} />

        {/* Introductions timeline/cards */}
        <TimelineSection 
          loading={loading}
          error={error}
          introductions={introductions}
          timeline={timeline}
          formatDate={formatDate}
        />

        {/* Values */}
        <ValuesSection values={values} />

        <Divider className="my-8 bg-gradient-to-r from-transparent via-[#39BDCC]/40 to-transparent h-[1px]" />

        {/* CTA */}
        <CTASection 
          isConsultationOpen={isConsultationOpen}
          setIsConsultationOpen={setIsConsultationOpen}
        />

        <ConsultationFormModal
          isOpen={isConsultationOpen}
          onClose={() => setIsConsultationOpen(false)}
        />
      </div>
    </section>
  );
}

// Hero Section Component with Scroll Animation
interface HeroSectionProps {
  title: any;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  loading: boolean;
  error: string | null;
  heroIntroduction: Introduction | undefined;
  introductions: Introduction[];
  formatDate: (value: string) => string;
}

const HeroSection = ({ 
  title, 
  selectedIndex, 
  setSelectedIndex, 
  loading, 
  error, 
  heroIntroduction, 
  introductions,
  formatDate 
}: HeroSectionProps) => {
  const { elementRef: leftRef, isVisible: leftVisible } = useScrollAnimation({ threshold: 0.1 });
  const { elementRef: rightRef, isVisible: rightVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
      <div ref={leftRef} className={`space-y-6 scroll-reveal-left ${leftVisible ? 'visible' : ''}`}>
            <h1 className={`${title()} text-4xl md:text-5xl text-gray-900 leading-tight`}>
              Hành trình kiến tạo nụ cười chuẩn y khoa & tràn đầy cảm hứng
            </h1>
            <p className="text-lg text-gray-600">
              Kết hợp chuyên môn nha khoa, công nghệ chuẩn quốc tế và sự tận tâm trong từng trải nghiệm.
              Mọi dịch vụ được thiết kế dựa trên nhu cầu cá nhân hóa, hướng tới vẻ đẹp bền vững và sức khỏe toàn diện.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                className="px-6 bg-[#39BDCC] text-white font-semibold hover:bg-[#2ca6b5]"
                endContent={<ArrowRightIcon className="w-4 h-4" />}
                onPress={() =>
                  window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
                }
              >
                Khám phá câu chuyện
              </Button>
              <Button variant="bordered" className="px-6" onPress={() => (window.location.href = "/services")}>
                Xem dịch vụ
              </Button>
            </div>
          </div>

          <div ref={rightRef} className={`relative scroll-reveal-right ${rightVisible ? 'visible' : ''}`}>
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#39BDCC]/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#2ca6b5]/20 rounded-full blur-3xl" />
            <div className="relative bg-white rounded-3xl shadow-2xl p-6 space-y-6 border border-white/60">
              {loading ? (
                <div className="flex flex-col items-center gap-4 py-8 text-gray-500">
                  <Spinner size="lg" color="primary" />
                  <p>Đang tải nội dung...</p>
                </div>
              ) : error ? (
                <div className="flex items-center gap-3 text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <InformationCircleIcon className="w-6 h-6" />
                  <p>{error}</p>
                </div>
              ) : heroIntroduction ? (
                <>
                  <div className="rounded-2xl overflow-hidden h-64 bg-gray-100">
                    <img
                      src={heroIntroduction.thumbnailUrl}
                      alt={heroIntroduction.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">{formatDate(heroIntroduction.createdAt)}</p>
                    <h3 className="text-2xl font-semibold text-gray-900">{heroIntroduction.title}</h3>
                    <p className="text-gray-600 whitespace-pre-line line-clamp-4">
                      {heroIntroduction.summary}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {introductions.map((item, idx) => (
                      <button
                        key={item._id}
                        className={`px-3 py-1 text-xs rounded-full border transition ${
                          idx === selectedIndex
                            ? "bg-[#39BDCC] text-white border-[#39BDCC]"
                            : "text-gray-500 border-gray-200 hover:border-[#39BDCC] hover:text-[#39BDCC]"
                        }`}
                        onClick={() => setSelectedIndex(idx)}
                      >
                        {item.title.split(" ").slice(0, 2).join(" ")}…
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-12">Chưa có nội dung giới thiệu.</div>
              )}
            </div>
          </div>
    </div>
  );
};

// Stats Section Component with Scroll Animation
interface StatsSectionProps {
  stats: Array<{ label: string; value: string }>;
}

const StatsSection = ({ stats }: StatsSectionProps) => {
  const { elementRef: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div ref={sectionRef} className={`grid grid-cols-2 md:grid-cols-4 gap-4 scroll-reveal-up ${sectionVisible ? 'visible' : ''}`}>
      {stats.map((item, index) => (
        <StatCard key={item.label} item={item} index={index} />
      ))}
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  item: { label: string; value: string };
  index: number;
}

const StatCard = ({ item, index }: StatCardProps) => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <Card 
      ref={elementRef} 
      className={`bg-white/70 border border-white/60 shadow-sm scroll-reveal-up ${isVisible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <CardBody className="text-center space-y-2">
        <p className="text-3xl font-bold text-[#39BDCC]">{item.value}</p>
        <p className="text-sm text-gray-500">{item.label}</p>
      </CardBody>
    </Card>
  );
};

// Timeline Section Component with Scroll Animation
interface TimelineSectionProps {
  loading: boolean;
  error: string | null;
  introductions: Introduction[];
  timeline: Introduction[];
  formatDate: (value: string) => string;
}

const TimelineSection = ({ loading, error, introductions, timeline, formatDate }: TimelineSectionProps) => {
  const { elementRef: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div ref={sectionRef} className={`bg-white rounded-3xl shadow-xl border border-white/60 p-8 space-y-6 scroll-reveal-up ${sectionVisible ? 'visible' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-[#39BDCC]">Hành trình</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">Các dấu mốc nổi bật</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" color="primary" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <InformationCircleIcon className="w-6 h-6" />
          <p>{error}</p>
        </div>
      ) : introductions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Chúng tôi sẽ cập nhật hành trình của Hải Anh Teeth trong thời gian sớm nhất.
        </div>
      ) : (
        <div className="space-y-8">
          {timeline.map((item) => (
            <TimelineItem key={item._id} item={item} formatDate={formatDate} />
          ))}
        </div>
      )}
    </div>
  );
};

// Timeline Item Component
interface TimelineItemProps {
  item: Introduction;
  formatDate: (value: string) => string;
}

const TimelineItem = ({ item, formatDate }: TimelineItemProps) => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <div ref={elementRef} className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-center scroll-reveal-up ${isVisible ? 'visible' : ''}`}>
      <div className="space-y-2">
        <p className="text-sm text-gray-400">{formatDate(item.createdAt)}</p>
        <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
      </div>
      <div className="md:col-span-2">
        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="flex flex-col md:flex-row gap-4 items-center">
            {item.thumbnailUrl && (
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-full md:w-40 h-40 object-cover rounded-2xl"
              />
            )}
            <p className="text-gray-600 whitespace-pre-line">{item.summary}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

// Values Section Component with Scroll Animation
interface ValuesSectionProps {
  values: Array<{
    icon: any;
    title: string;
    desc: string;
  }>;
}

const ValuesSection = ({ values }: ValuesSectionProps) => {
  const { elementRef: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div ref={sectionRef} className={`space-y-6 scroll-reveal-up ${sectionVisible ? 'visible' : ''}`}>
      <div className="text-center space-y-3">
        <p className="text-sm uppercase tracking-[0.4em] text-[#39BDCC]">Giá trị cốt lõi</p>
        <h2 className="text-3xl font-bold text-gray-900">Vì sao khách hàng tin tưởng?</h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Mỗi dịch vụ được xây dựng dựa trên 4 trụ cột: chuyên môn, công nghệ, trải nghiệm và trách nhiệm.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {values.map((value, index) => (
          <ValueCard key={value.title} value={value} index={index} />
        ))}
      </div>
    </div>
  );
};

// Value Card Component
interface ValueCardProps {
  value: {
    icon: any;
    title: string;
    desc: string;
  };
  index: number;
}

const ValueCard = ({ value, index }: ValueCardProps) => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const Icon = value.icon;
  const animationClass = index % 2 === 0 ? 'scroll-reveal-left' : 'scroll-reveal-right';

  return (
    <Card 
      ref={elementRef} 
      className={`border border-gray-100 shadow-sm hover:shadow-lg transition ${animationClass} ${isVisible ? 'visible' : ''}`}
    >
      <CardBody className="flex gap-4 items-start">
        <div className="w-14 h-14 rounded-2xl bg-[#39BDCC]/10 flex items-center justify-center text-[#39BDCC]">
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h4 className="text-xl font-semibold text-gray-900">{value.title}</h4>
          <p className="text-gray-600 mt-2">{value.desc}</p>
        </div>
      </CardBody>
    </Card>
  );
};

// CTA Section Component with Scroll Animation
interface CTASectionProps {
  isConsultationOpen: boolean;
  setIsConsultationOpen: (open: boolean) => void;
}

const CTASection = ({ isConsultationOpen, setIsConsultationOpen }: CTASectionProps) => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div 
      ref={elementRef} 
      className={`rounded-3xl bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white p-10 flex flex-col md:flex-row gap-6 items-center justify-between shadow-2xl scroll-reveal-up ${isVisible ? 'visible' : ''}`}
    >
      <div className="space-y-3 max-w-2xl">
        <p className="uppercase text-sm tracking-[0.4em]">Sẵn sàng đồng hành</p>
        <h3 className="text-3xl font-bold">Bạn muốn cá nhân hóa cụ cười của mình ?</h3>
        <p className="text-white/80">
          Đội ngũ chăm sóc khách hàng sẽ gọi lại trong 15 phút để xác nhận thông tin và gợi ý giải pháp phù hợp nhất.
        </p>
      </div>
      <Button
        size="lg"
        color="primary"
        className="bg-white text-[#39BDCC] px-8 font-semibold"
        onPress={() => setIsConsultationOpen(true)}
      >
        Để lại thông tin
      </Button>
    </div>
  );
};
