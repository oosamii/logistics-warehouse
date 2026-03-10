import React, { useState } from "react";
import { MapPin, Sparkles, Paperclip, Camera, ScanLine } from "lucide-react";

const Card = ({ icon, title, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center gap-2">
      {icon}
      <div className="text-lg font-semibold text-gray-900">{title}</div>
    </div>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div className="mb-2 text-sm font-medium text-gray-900">{children}</div>
);

const DisabledBox = ({ children }) => (
  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
    {children}
  </div>
);

const InputWithScan = ({ value, onChange, DisabledBox }) => (
  <div className="relative">
    <input
      value={value}
      disabled={DisabledBox}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-blue-500 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
    />
    {/* <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
      <ScanLine size={18} />
    </div> */}
  </div>
);

const Progress = ({ percent }) => (
  <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
    <div
      className="h-2 rounded-full bg-blue-600"
      style={{ width: `${percent}%` }}
    />
  </div>
);

const PutawayRightPanel = ({ task }) => {
  const [bin, setBin] = useState(task.suggestedBin);

  return (
    <>
      {/* Target Location */}
      <Card
        icon={<MapPin size={18} className="text-gray-700" />}
        title="Target Location"
      >
        <div className="space-y-4">
          <div>
            <Label>Zone</Label>
            <DisabledBox>{task.suggestedZone} (Suggested)</DisabledBox>
          </div>

          <div>
            <Label>Location / Bin</Label>
            <InputWithScan DisabledBox={true} value={bin} onChange={setBin} />
          </div>

          <div className="pt-2 overflow-hidden">
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium text-gray-900">
                Bin Capacity ({task.suggestedBin})
              </div>
              <div className="text-gray-500">
                {task.capacityUsedPercent}% Used
              </div>
            </div>

            <Progress percent={task.capacityUsedPercent} />

            <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
              <div>Remaining capacity: {task.remainingCapacityText}</div>
              <div>{task.maxCapacityText}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Slotting Suggestion */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-blue-700">
            <Sparkles size={18} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-blue-900">
              Slotting Suggestion
            </div>
            <div className="mt-2 text-sm text-blue-800">
              This location was suggested based on high SKU velocity and
              proximity to the packing area.
            </div>
            <button className="mt-4 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-gray-800">
              Suggest Alternate
            </button>
          </div>
        </div>
      </div>

      {/* Evidence / Notes */}
      <Card
        icon={<Paperclip size={18} className="text-gray-700" />}
        title="Evidence / Notes"
      >
        <div className="space-y-4">
          <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white">
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <div className="rounded-full bg-gray-50 p-3">
                <Camera size={18} />
              </div>
              <div className="text-sm">Upload Photo (Optional)</div>
            </div>
          </div>

          <textarea
            rows={4}
            placeholder="Add internal notes here..."
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </Card>
    </>
  );
};

export default PutawayRightPanel;
