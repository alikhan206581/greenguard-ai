"use client";

import React, { useState } from "react";
import { CheckSquare, Square, ShieldAlert } from "lucide-react";

interface ReviewerChecklistProps {
  checklist: string[];
  limitationsNotice: string;
}

export function ReviewerChecklist({ checklist, limitationsNotice }: ReviewerChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Reviewer Action Items &amp; Next Evidence Checklist
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Recommended verification steps before submitting to the Green Bond Credit Committee
        </p>

        <div className="space-y-2.5 pt-2">
          {checklist.map((item, index) => {
            const isChecked = !!checkedItems[index];
            return (
              <div
                key={index}
                onClick={() => toggleCheck(index)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 flex items-start space-x-3 ${
                  isChecked
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-slate-50/80 border-slate-200 text-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="mt-0.5">
                  {isChecked ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </div>
                <span className={`text-xs leading-relaxed ${isChecked ? "line-through text-slate-400" : ""}`}>
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
            <h4 className="text-sm font-semibold uppercase tracking-wider">
              Legal Scope &amp; Limitations Notice
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {limitationsNotice}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-normal shadow-2xs">
          <strong className="text-slate-800 block mb-1">Audit Protocol Standard:</strong>
          Evaluations strictly assess agreement between borrower claims and provided utility evidence. Independent meter certification requires DISCO/utility telemetry.
        </div>
      </div>
    </div>
  );
}
