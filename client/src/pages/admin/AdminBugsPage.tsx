import React, { useEffect, useState } from 'react';
import { 
  Bug, AlertOctagon, CheckCircle2, Clock, 
  Terminal, ShieldAlert, RefreshCw, X 
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminBugsPage: React.FC = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const { addToast } = useToast();

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminBugs();
      if (res.success && res.data) {
        setIssues(res.data);
      }
    } catch (err) {
      console.error('Failed to load error logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.updateBugStatus(id, newStatus);
      if (res.success) {
        addToast(`Issue marked as ${newStatus}.`, 'success');
        fetchIssues();
        if (selectedIssue && selectedIssue._id === id) {
          setSelectedIssue({ ...selectedIssue, status: newStatus });
        }
      } else {
        addToast(res.message || 'Failed to update issue', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Error updating issue', 'error');
    }
  };

  const handleTriggerTestError = async () => {
    try {
      await api.triggerTestError();
    } catch (err: any) {
      addToast('Simulated 500 error triggered & logged to database!', 'info');
      fetchIssues();
    }
  };

  const openIssuesCount = issues.filter((i) => i.status === 'open').length;
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Bug className="w-6 h-6 text-rose-400" /> Bug & Exception Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized error tracking, stack traces, correlation IDs, and resolution workflows
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTriggerTestError}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 rounded-xl text-xs font-semibold transition border border-rose-500/20"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Trigger Test Error
          </button>
          <button
            type="button"
            onClick={fetchIssues}
            className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-amber-400 block mb-1">Active / Open Issues</span>
          <span className="text-2xl font-black text-white">{openIssuesCount}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-rose-400 block mb-1">Critical Severity</span>
          <span className="text-2xl font-black text-rose-400">{criticalCount}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-emerald-400 block mb-1">Resolved Issues</span>
          <span className="text-2xl font-black text-emerald-400">{resolvedCount}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading error records...</div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Zero unresolved bugs or uncaught exceptions logged in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Error ID</th>
                  <th className="py-3 px-4">Route / Location</th>
                  <th className="py-3 px-4">Exception Message</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {issues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {issue.errorId || issue._id.slice(-8).toUpperCase()}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      {issue.route || '/api/general'}
                    </td>

                    <td className="py-3 px-4 text-slate-200 max-w-xs">
                      <span className="font-semibold block truncate">{issue.message}</span>
                      <span className="text-[10px] text-slate-500">{issue.errorType || 'Error'}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {new Date(issue.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        issue.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                        issue.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {issue.severity || 'error'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        issue.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' :
                        issue.status === 'investigating' ? 'bg-indigo-500/10 text-indigo-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {issue.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedIssue(issue)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedIssue(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              Exception Diagnostic #{selectedIssue.errorId || selectedIssue._id}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Logged on {new Date(selectedIssue.createdAt).toLocaleString()}
            </p>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono">
                <span className="text-rose-400 font-bold block mb-1">Error Message:</span>
                <span className="text-slate-200">{selectedIssue.message}</span>
              </div>

              {selectedIssue.stackTrace && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Stack Trace:</span>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 overflow-x-auto max-h-48">
                    {selectedIssue.stackTrace}
                  </pre>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Current status:</span>
                  <span className="font-bold uppercase text-white">{selectedIssue.status}</span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedIssue.status !== 'resolved' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedIssue._id, 'resolved')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                    >
                      Mark as Resolved
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedIssue._id, 'open')}
                      className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition"
                    >
                      Reopen Issue
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBugsPage;
