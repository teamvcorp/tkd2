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
  stripeAccount?: {
    id: string
    businessName: string | null
    email: string | null
    country: string | null
    chargesEnabled: boolean
    payoutsEnabled: boolean
  }
  bankInfo?: {
    bankName: string | null
    last4: string | null
    routingNumber: string | null
    accountHolderName: string | null
    currency: string | null
  } | null
  availableBalance?: { amount: number; currency: string }[]
  pendingBalance?: { amount: number; currency: string }[]
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

          {/* Stripe Account & Bank Info Header */}
          <div className="bg-white rounded-lg shadow print:shadow-none p-6 print:p-0 mb-6 print:mb-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              {/* Stripe logo + account info */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {/* Stripe logo SVG */}
                  <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" width="80" height="34" className="text-[#635BFF]">
                    <path fill="currentColor" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a12.56 12.56 0 0 1-4.56.85c-4.05 0-6.83-2.11-6.83-7.07 0-4.26 2.32-7.13 6.15-7.13 3.78 0 6.06 2.86 6.06 7.07v1.36zm-4.12-5.45c-1.1 0-2.04.78-2.2 2.55h4.32c-.04-1.5-.72-2.55-2.12-2.55zM40.95 20.05c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V6.25h3.56l.18 1.05A4.67 4.67 0 0 1 41 5.97c3.17 0 5.37 3.11 5.37 7.05 0 4.53-2.32 7.03-5.42 7.03zm-.8-10.36c-.97 0-1.6.42-2.12 1.08l.02 5.54c.5.6 1.14 1.02 2.1 1.02 1.68 0 2.63-1.85 2.63-3.84 0-1.94-.97-3.8-2.63-3.8zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.87V.87zm-4.32 9.35v9.79H19.8V6.25h3.5l.24 1.56A5.02 5.02 0 0 1 27.63 6v3.86c-.46-.1-2.64-.32-3.71 1.36zM14.54 20.05c-2.04 0-3.34-.72-4.33-1.47l-.02 4.63-4.12.87V10.15h-.02V6.27h3.58l.16.96c.97-.87 2.27-1.38 3.82-1.38 3.22 0 5.48 3.11 5.48 7.05 0 4.53-2.37 7.15-4.55 7.15zm-.94-10.38c-.97 0-1.56.34-2.14 1.08l.02 5.54c.6.66 1.16 1.02 2.12 1.02 1.61 0 2.63-1.85 2.63-3.84 0-1.94-1.02-3.8-2.63-3.8zM2.57 11.44c0-.7.6-1.02 1.56-1.02 1.4 0 3.15.42 4.54 1.2V7.98C7.14 7.37 5.63 7.1 4.13 7.1 1.66 7.1 0 8.43 0 10.63c0 4.15 5.74 3.5 5.74 5.28 0 .85-.74 1.11-1.76 1.11-1.52 0-3.47-.63-5.02-1.47l-.02 3.71c1.7.74 3.42 1.06 5.02 1.06 2.56 0 4.32-1.26 4.32-3.53-.02-4.47-5.71-3.7-5.71-5.35z"/>
                  </svg>
                </div>
                <div className="text-sm">
                  {bankStatement.stripeAccount && (
                    <>
                      <p className="font-semibold text-gray-900 text-base">
                        {bankStatement.stripeAccount.businessName || 'Stripe Account'}
                      </p>
                      {bankStatement.stripeAccount.email && (
                        <p className="text-gray-600">{bankStatement.stripeAccount.email}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-0.5">
                        Account: {bankStatement.stripeAccount.id}
                        {bankStatement.stripeAccount.country && ` · ${bankStatement.stripeAccount.country}`}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Bank info */}
              <div className="text-sm text-right">
                {bankStatement.bankInfo && (
                  <>
                    <p className="font-semibold text-gray-900">
                      {bankStatement.bankInfo.bankName || 'Bank Account'}
                    </p>
                    {bankStatement.bankInfo.accountHolderName && (
                      <p className="text-gray-600">{bankStatement.bankInfo.accountHolderName}</p>
                    )}
                    {bankStatement.bankInfo.last4 && (
                      <p className="text-gray-600">
                        Account ending in ••{bankStatement.bankInfo.last4}
                      </p>
                    )}
                    {bankStatement.bankInfo.routingNumber && (
                      <p className="text-gray-500 text-xs">
                        Routing: {bankStatement.bankInfo.routingNumber}
                      </p>
                    )}
                  </>
                )}
                {bankStatement.availableBalance && bankStatement.availableBalance.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Available Balance</p>
                    {bankStatement.availableBalance.map((b, i) => (
                      <p key={i} className="font-semibold text-gray-900">
                        {fmtMoney(b.amount, b.currency)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
