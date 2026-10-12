import React from 'react';
import { FileSearch, Layers } from 'lucide-react';

interface FileContentInspectionCardProps {
  exactFileContents?: string;
  fileContentItems?: string[];
}

export function FileContentInspectionCard({ exactFileContents, fileContentItems }: FileContentInspectionCardProps) {
  if (!exactFileContents && (!fileContentItems || fileContentItems.length === 0)) {
    return null;
  }

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 text-blue-400">
            <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>📂 File Content & Subject Analysis</span>
            </h4>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
              Exact inspection of uploaded files & literal input
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-center px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          <span>Factual Scan</span>
        </div>
      </div>

      <div className="space-y-6">
        {exactFileContents && (
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              🔍 Exact Content & Narrative Breakdown
            </h5>
            <div className="bg-slate-950/60 border border-slate-800/40 rounded-2xl p-5 text-sm font-medium text-slate-300 leading-relaxed">
              {exactFileContents}
            </div>
          </div>
        )}

        {fileContentItems && fileContentItems.length > 0 && (
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              📑 Identified Subjects & Components Found
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fileContentItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 px-4 py-3 bg-slate-950/35 border border-slate-800/30 rounded-xl text-sm font-medium text-slate-300/90"
                >
                  <span className="text-blue-400 font-bold mt-0.5 shrink-0">✔</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
