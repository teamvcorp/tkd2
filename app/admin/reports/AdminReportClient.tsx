'use client'

import { useState, useRef } from 'react'

type Tab = 'transactions' | 'bank-statement'

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

interface BalanceTxn {
  id: string
  type: string
  amount: number
  fee: number
  net: number
  currency: string
  created: number
  description: string | null
  status: string
}

interface BankStatementData {
  ok: boolean
  from: number
  to: number
  count: number
  totalGross: number
  totalFees: number
  totalNet: number
  currency: string
  transactions: BalanceTxn[]
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
  const [tab, setTab] = useState<Tab>('transactions')
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<ReportData | null>(null)
  const [bankStatement, setBankStatement] = useState<BankStatementData | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  async function fetchReport() {
    setError('')
    setReport(null)
    setBankStatement(null)
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
      if (tab === 'transactions') {
        const res = await fetch(`/api/admin/reports?from=${from}&to=${to}`)
        const data = await res.json()
        if (!res.ok || !data.ok) {
          setError(data.error || 'Failed to fetch report.')
          return
        }
        setReport(data)
      } else {
        const res = await fetch(`/api/admin/reports/bank-statement?from=${from}&to=${to}`)
        const data = await res.json()
        if (!res.ok || !data.ok) {
          setError(data.error || 'Failed to fetch bank statement.')
          return
        }
        setBankStatement(data)
      }
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
          <h1 className="text-2xl font-bold text-gray-900">
            {tab === 'transactions' ? 'Transaction Report' : 'Bank Statement'}
          </h1>
          <a href="/admin" className="text-sm text-blue-600 hover:underline">
            ← Back to Admin
          </a>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setTab('transactions'); setReport(null); setBankStatement(null); setError('') }}
            className={`px-4 py-2 rounded font-medium text-sm ${
              tab === 'transactions'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Transaction Report
          </button>
          <button
            onClick={() => { setTab('bank-statement'); setReport(null); setBankStatement(null); setError('') }}
            className={`px-4 py-2 rounded font-medium text-sm ${
              tab === 'bank-statement'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Bank Statement
          </button>
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
              {loading ? 'Loading…' : tab === 'transactions' ? 'Generate Report' : 'Generate Statement'}
            </button>
            {(report || bankStatement) && (
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
      {report && tab === 'transactions' && (
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

      {/* ---- Printable bank statement area ---- */}
      {bankStatement && tab === 'bank-statement' && (
        <div ref={printRef} className="max-w-5xl mx-auto px-4 pb-12 print:px-0 print:py-0">
          <div className="hidden print:block mb-4">
            <h1 className="text-xl font-bold">Bank Statement</h1>
            <p className="text-sm text-gray-600">
              Taekwondo of Storm Lake &mdash; Generated {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow print:shadow-none p-6 print:p-0">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Gross</p>
                <p className="text-lg font-bold text-green-900">
                  {fmtMoney(bankStatement.totalGross, bankStatement.currency)}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-xs font-medium text-red-700 uppercase tracking-wider">Fees</p>
                <p className="text-lg font-bold text-red-900">
                  {fmtMoney(bankStatement.totalFees, bankStatement.currency)}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Net</p>
                <p className="text-lg font-bold text-blue-900">
                  {fmtMoney(bankStatement.totalNet, bankStatement.currency)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{bankStatement.count}</span> entry
                {bankStatement.count !== 1 ? 'ies' : ''}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' — '}
                {new Date(toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {bankStatement.transactions.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">
                No balance transactions in this date range.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300 text-left text-gray-600">
                      <th className="py-2 pr-3 font-medium">Date</th>
                      <th className="py-2 pr-3 font-medium">Type</th>
                      <th className="py-2 pr-3 font-medium">Description</th>
                      <th className="py-2 pr-3 font-medium text-right">Gross</th>
                      <th className="py-2 pr-3 font-medium text-right">Fee</th>
                      <th className="py-2 font-medium text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankStatement.transactions.map(t => (
                      <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 pr-3 whitespace-nowrap text-gray-800">
                          {fmtDate(t.created)}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            t.type === 'charge' ? 'bg-green-100 text-green-800' :
                            t.type === 'payout' ? 'bg-blue-100 text-blue-800' :
                            t.type === 'refund' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-gray-700 max-w-xs truncate">
                          {t.description || '—'}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap text-right text-gray-900">
                          {fmtMoney(t.amount, t.currency)}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap text-right text-red-600">
                          {t.fee ? `−${fmtMoney(t.fee, t.currency)}` : '—'}
                        </td>
                        <td className="py-2 whitespace-nowrap text-right font-medium text-gray-900">
                          {fmtMoney(t.net, t.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 font-semibold">
                      <td className="py-3 pr-3 text-gray-900" colSpan={3}>Totals</td>
                      <td className="py-3 pr-3 text-right text-gray-900">
                        {fmtMoney(bankStatement.totalGross, bankStatement.currency)}
                      </td>
                      <td className="py-3 pr-3 text-right text-red-600">
                        {bankStatement.totalFees ? `−${fmtMoney(bankStatement.totalFees, bankStatement.currency)}` : '—'}
                      </td>
                      <td className="py-3 text-right text-gray-900">
                        {fmtMoney(bankStatement.totalNet, bankStatement.currency)}
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
