'use client'

import { useState } from 'react'
import Link from 'next/link'
import { History, Calendar, FileText, ChevronRight, Activity, ChevronDown, ChevronUp } from 'lucide-react'

export function ReportHistory({ reports }: { reports: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-indigo-300 transition-all font-semibold text-slate-800 text-lg shadow-sm group"
      >
        <span className="flex items-center group-hover:text-indigo-600 transition-colors">
          <History className="w-6 h-6 mr-3 text-indigo-600" />
          View Previous Diagnostics
          <span className="ml-3 px-2.5 py-0.5 bg-slate-100 text-slate-600 text-sm rounded-full font-medium group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
            {reports ? reports.length : 0} specific records
          </span>
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-500 group-hover:text-indigo-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-indigo-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {!reports || reports.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>You haven't generated any health reports yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {reports.map((report) => (
                <Link 
                  key={report.id} 
                  href={`/report/${report.id}`}
                  className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center text-sm font-medium text-slate-500">
                      <Calendar className="w-4 h-4 mr-1.5 opacity-70" />
                      {new Date(report.created_at).toLocaleDateString(undefined, { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                      })}
                    </div>
                    {report.is_emergency && (
                      <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-md flex items-center">
                        <Activity className="w-3 h-3 mr-1" />
                        Urgent
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-slate-800 text-xl mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {report.ai_response?.condition || "Unspecified Condition"}
                  </h3>
                  
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                    "{report.symptom_description}"
                  </p>
                  
                  <div className="flex items-center text-indigo-600 text-sm font-bold mt-auto pt-4 border-t border-slate-50">
                    View Full Report 
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
