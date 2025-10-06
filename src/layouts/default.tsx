import Footer from "@/components/Footer";

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col h-screen">
      <main className="flex-grow">
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <Footer />
      </footer>
    </div>
  );
}
