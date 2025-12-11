import { Header } from '@/components/layout/header';
import ScannerInterface from '@/components/scanner/ScannerInterface';

export default function ScannerPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Intelligent Scanner" />
      <main className="flex-1 flex items-center justify-center p-4 md:p-6">
        <ScannerInterface />
      </main>
    </div>
  );
}
