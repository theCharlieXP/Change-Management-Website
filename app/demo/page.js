'use client';

import InsightSearchExample from '../components/InsightSearchExample';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Insight Search Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Try out the Insight Search feature below. You get 20 free searches on the Basic plan before needing to upgrade to Pro for unlimited searches.
          </p>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <InsightSearchExample />
        </div>
      </div>
    </div>
  );
} 