'use client'

import { useState, useRef } from 'react'

interface Charge {
  id: string
  amount: number
  currency: string
  created: number
  description: string | null
  receiptEmail: string | null
  paymentMethod: string | null
  status: string
}

interface ReportData {
  ok: boolean
  from: number
  to: number
  count: number
  totalAmount: number
  currency: string
  charges: Charge[]
  error?: string
}

function fmtDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

/** Convert YYYY-MM-DD → start of that day in UTC */
function toUnixStart(dateStr: string) {
  return Math.floor(new Date(dateStr + 'T00:00:00').getTime() / 1000)
}

/** Convert YYYY-MM-DD → end of that day in UTC */
function toUnixEnd(dateStr: string) {
  return Math.floor(new Date(dateStr + 'T23:59:59').getTime() / 1000)
}

export default function AdminReportClient() {
  const today = new Date().toISOString().slice(0, 10)
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<ReportData | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  async function fetchReport() {
    setError('')
    setReport(null)
    if (!fromDate || !toDate) {
      setError('Please select both start and end dates.')
      return
    }
    const from = toUnixStart(fromDate)
    const to = toUnixEnd(toDate)
    if (from >= to) {
      setError('Start date must be before or equal to End date.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?from=${from}&to=${to}`)
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || 'Failed to fetch report.')
        return
      }
      setReport(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---- Screen-only controls ---- */}
      <div className="print:hidden max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transaction Report</h1>
          <a href="/admin" className="text-sm text-blue-600 hover:underline">
            ← Back to Admin
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="border rounded px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="border rounded px-3 py-2 text-gray-900"
              />
            </div>
            <button
              onClick={fetchReport}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Generate Report'}
            </button>
            {report && (
              <button
                onClick={handlePrint}
                className="bg-gray-700 text-white px-6 py-2 rounded hover:bg-gray-800"
              >
                Print / Save PDF
              </button>
            )}
          </div>
          {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
        </div>
      </div>

      {/* ---- Printable report area ---- */}
      {report && (
        <div ref={printRef} className="max-w-5xl mx-auto px-4 pb-12 print:px-0 print:py-0">
          {/* Print header (hidden on screen, shown on print) */}
          <div className="hidden print:block mb-4">
            <h1 className="text-xl font-bold">Transaction Report</h1>
            <p className="text-sm text-gray-600">
              Taekwondo of Storm Lake &mdash; Generated {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow print:shadow-none p-6 print:p-0">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{report.count}</span> transaction
                {report.count !== 1 ? 's' : ''} &middot;{' '}
                <span className="font-medium text-gray-900">
                  {fmtMoney(report.totalAmount, report.currency)}
                </span>{' '}
                total
              </div>
              <div className="text-sm text-gray-500">
                {new Date(fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' — '}
                {new Date(toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {report.charges.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">
                No successful transactions in this date range.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300 text-left text-gray-600">
                      <th className="py-2 pr-3 font-medium">Date</th>
                      <th className="py-2 pr-3 font-medium">Amount</th>
                      <th className="py-2 pr-3 font-medium">Description</th>
                      <th className="py-2 pr-3 font-medium">Email</th>
                      <th className="py-2 font-medium print:hidden">Charge ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.charges.map(c => (
                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 pr-3 whitespace-nowrap text-gray-800">
                          {fmtDate(c.created)}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap font-medium text-gray-900">
                          {fmtMoney(c.amount, c.currency)}
                        </td>
                        <td className="py-2 pr-3 text-gray-700 max-w-xs truncate">
                          {c.description || '—'}
                        </td>
                        <td className="py-2 pr-3 text-gray-700">{c.receiptEmail || '—'}</td>
                        <td className="py-2 text-gray-400 text-xs font-mono print:hidden">
                          {c.id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 font-semibold">
                      <td className="py-3 pr-3 text-gray-900">Total</td>
                      <td className="py-3 pr-3 text-gray-900">
                        {fmtMoney(report.totalAmount, report.currency)}
                      </td>
                      <td colSpan={3} className="py-3 text-gray-500 text-right print:hidden">
                        {report.count} transaction{report.count !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
