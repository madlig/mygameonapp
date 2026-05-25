import React from 'react';
import { Loader2, Table2 } from 'lucide-react';
import OperationalDashboard from '../ui/OperationalDashboard';

const DailyOpsTab = ({
  revenueReport,
  recapData,
  loading,
  onRefreshRequest,
  onImportedRangeDetected,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-[#FFD100] w-6 h-6" />
      </div>
    );
  }

  if (!revenueReport || revenueReport.length === 0) {
    return (
      <div className="text-center py-12 bg-[#111317] border border-[#2A2F39] rounded-xl">
        <Table2 size={32} className="mx-auto text-[#7E8796] mb-3" />
        <p className="text-sm text-[#C8CFDA]">
          Tidak ada data untuk periode ini
        </p>
        <p className="text-xs text-[#7E8796] mt-1">
          Import Shopee reports atau pilih periode lain.
        </p>
      </div>
    );
  }

  return (
    <OperationalDashboard
      revenueReport={revenueReport}
      recapData={recapData}
      onRefreshRequest={onRefreshRequest}
      onImportedRangeDetected={onImportedRangeDetected}
    />
  );
};

export default DailyOpsTab;
