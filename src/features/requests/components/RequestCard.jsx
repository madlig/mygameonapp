import React from 'react';
import { 
  Clock, CheckCircle, Trash2, User, 
  Gamepad2, Calendar, Server, Zap, ArrowRight, Play, Loader2, FileCheck, XCircle
} from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Swal from 'sweetalert2';

const RequestCard = ({ request, onApproveClick }) => {
  
  // Handlers
  const handleAcceptToQueue = async () => { await updateDoc(doc(db, 'requests', request.id), { status: 'queued', acceptedAt: new Date() }); };
  const handleStartUpload = async () => { await updateDoc(doc(db, 'requests', request.id), { status: 'processing', startedAt: new Date() }); };
  const toggleRdpBatch = async () => { await updateDoc(doc(db, 'requests', request.id), { isRdpBatch: !request.isRdpBatch }); };
  
  // LOGIKA BARU: Cukup toggle boolean, tidak perlu hitung score lagi
  const toggleUrgent = async () => { await updateDoc(doc(db, 'requests', request.id), { isUrgent: !request.isUrgent }); };
  
  const handleMarkAsUploaded = async () => {
    const result = await Swal.fire({
      title: 'Konfirmasi Selesai Upload',
      text: "Apakah file game benar-benar sudah selesai diupload? Status akan berubah menjadi 'Siap Publish'.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Selesai',
      cancelButtonText: 'Batal'
    });
    if (result.isConfirmed) {
      await updateDoc(doc(db, 'requests', request.id), { status: 'uploaded', uploadedAt: new Date() });
      Swal.fire({ title: 'Berhasil!', icon: 'success', timer: 1000, showConfirmButton: false });
    }
  };

  const handleCancelUpload = async () => {
    const result = await Swal.fire({
      title: 'Batalkan Upload?',
      text: "Kembali ke antrian?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Tidak'
    });
    if (result.isConfirmed) await updateDoc(doc(db, 'requests', request.id), { status: 'queued' });
  };

  const handleReject = async () => {
    const result = await Swal.fire({
      title: 'Hapus Request?',
      text: "Data akan dihapus permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    });
    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'requests', request.id));
      Swal.fire({ title: 'Dihapus!', icon: 'success', timer: 1000, showConfirmButton: false });
    }
  };

  const getStatusBadge = () => {
    const s = request.status || 'pending';
    switch(s) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-[10px] font-bold border border-yellow-200">Pending</span>;
      case 'queued': return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200 flex items-center"><Clock size={10} className="mr-1"/> Antrian</span>;
      case 'processing': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-[10px] font-bold border border-blue-200 flex items-center animate-pulse"><Loader2 size={10} className="mr-1 animate-spin"/> Uploading...</span>;
      case 'uploaded': return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-200 flex items-center"><FileCheck size={10} className="mr-1"/> Siap Publish</span>;
      default: return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-[10px] font-bold">Unknown</span>;
    }
  };

  // --- DATA DISPLAY ---
  const title = request.title || 'Tanpa Judul';
  const platform = request.platform || 'PC';
  const displayUser = request.requesterName || 'Anonymous'; // Menggunakan field requesterName yang sudah standar
  
  const dateDisplay = request.createdAt?.seconds 
    ? format(new Date(request.createdAt.seconds * 1000), 'd MMM', { locale: id }) 
    : 'No Date';

  return (
    <div className={`bg-white rounded-xl p-5 border shadow-sm transition-all hover:shadow-md relative group
      ${request.isUrgent ? 'border-red-400 ring-1 ring-red-100' : 'border-slate-100'}
      ${request.status === 'processing' ? 'ring-1 ring-blue-200 bg-blue-50/30' : ''}
      ${request.status === 'uploaded' ? 'bg-emerald-50/30 border-emerald-200' : ''}
    `}>
      <div className="absolute top-4 right-4 flex gap-2">
        {request.isUrgent && <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-md flex items-center"><Zap size={10} className="mr-1 fill-red-700" /> URGENT</span>}
        {request.isRdpBatch && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md flex items-center"><Server size={10} className="mr-1" /> RDP</span>}
        {getStatusBadge()}
      </div>

      <div className="pr-24"> 
        <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{title}</h3>
        <div className="flex items-center text-xs text-slate-500 gap-4 mb-3">
          <span className={`flex items-center ${displayUser === 'Admin' ? 'text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded' : ''}`}>
            <User size={12} className="mr-1" /> {displayUser}
          </span>
          <span className="flex items-center"><Gamepad2 size={12} className="mr-1" /> {platform}</span>
          <span className="flex items-center"><Calendar size={12} className="mr-1" /> {dateDisplay}</span>
        </div>
        {request.notes && <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-600 italic mb-4 border border-slate-100">"{request.notes}"</div>}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
        {(request.status || 'pending') === 'pending' && (
          <>
            <button onClick={handleReject} className="text-slate-400 hover:text-red-600 text-xs font-medium px-2 flex items-center"><Trash2 size={14} className="mr-1" /> Tolak</button>
            <button onClick={handleAcceptToQueue} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm ml-auto flex items-center">Masuk Antrian <ArrowRight size={14} className="ml-2" /></button>
          </>
        )}

        {['queued', 'processing', 'uploaded'].includes(request.status) && (
          <>
            <div className="flex gap-2">
              <button onClick={toggleUrgent} className={`p-2 rounded-lg border ${request.isUrgent ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-400'}`} title="Set Urgent"><Zap size={16} className={request.isUrgent ? 'fill-red-600' : ''} /></button>
              <button onClick={toggleRdpBatch} className={`p-2 rounded-lg border ${request.isRdpBatch ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-white border-slate-200 text-slate-400'}`} title="Set RDP Batch"><Server size={16} /></button>
            </div>
            <div className="flex gap-2 ml-auto items-center">
              {request.status === 'queued' && (
                <>
                  <button onClick={handleReject} className="p-2 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 size={16} /></button>
                  <button onClick={handleStartUpload} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg shadow-sm flex items-center">
                    <Play size={14} className="mr-2 fill-slate-700" /> Start Upload
                  </button>
                </>
              )}
              {request.status === 'processing' && (
                <>
                  <button onClick={handleCancelUpload} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium mr-2 flex items-center" title="Batal"><XCircle size={16} className="mr-1" /> Batal</button>
                  <button onClick={handleMarkAsUploaded} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center animate-pulse"><CheckCircle size={14} className="mr-2" /> Tandai Selesai</button>
                </>
              )}
              {request.status === 'uploaded' && (
                <button onClick={() => onApproveClick(request)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center"><FileCheck size={14} className="mr-2" /> Finalisasi Katalog</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestCard;