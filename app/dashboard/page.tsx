import { FileText, Upload, Zap, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard"
        description="Welcome to DocuGenius, your intelligent document assistant"
        icon={<Zap className="h-6 w-6 text-brand-yellow-400" />}
      />
      
      <div className="flex-1 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-brand-gray-100">Tools & Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* PDF Upload & Processing Card */}
          <Link href="/pdf/upload" className="block transition-all hover:scale-[1.01] hover:-translate-y-1">
            <Card className="h-full bg-brand-gray-800 border-brand-gray-700 hover:border-brand-yellow-400/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="bg-brand-gray-700 inline-flex p-2.5 rounded-md text-brand-yellow-400 mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <CardTitle className="text-brand-gray-100">PDF Upload</CardTitle>
                <CardDescription className="text-brand-gray-400">
                  Upload and process PDF documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-brand-gray-300">
                  Upload your PDF files for advanced processing, text extraction, and analysis.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          {/* PDF Viewer Card */}
          <Link href="/pdf/view" className="block transition-all hover:scale-[1.01] hover:-translate-y-1">
            <Card className="h-full bg-brand-gray-800 border-brand-gray-700 hover:border-brand-yellow-400/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="bg-brand-gray-700 inline-flex p-2.5 rounded-md text-brand-yellow-400 mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle className="text-brand-gray-100">PDF Viewer</CardTitle>
                <CardDescription className="text-brand-gray-400">
                  View and read your PDF documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-brand-gray-300">
                  Open and view your PDF files directly in the browser with our PDF viewer.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          {/* PDF Chat Card */}
          <Link href="/pdf/chat" className="block transition-all hover:scale-[1.01] hover:-translate-y-1">
            <Card className="h-full bg-brand-gray-800 border-brand-gray-700 hover:border-brand-yellow-400/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="bg-brand-gray-700 inline-flex p-2.5 rounded-md text-brand-yellow-400 mb-3">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle className="text-brand-gray-100">PDF Chat</CardTitle>
                <CardDescription className="text-brand-gray-400">
                  Chat with your PDF documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-brand-gray-300">
                  Ask questions and get insights from your PDFs through an intuitive chat interface.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
} 