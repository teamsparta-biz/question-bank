import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePools, createPool } from '../hooks/usePools'

export default function PoolsPage() {
  const { pools, loading, refetch } = usePools()
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await createPool(name, desc)
      setName('')
      setDesc('')
      setShowNew(false)
      refetch()
    } catch (err) {
      console.error(err)
      alert('생성 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">문항풀</h2>
          <p className="text-sm text-slate-500">{pools.length}개 풀</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + 새 문항풀
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-4 mb-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="문항풀 이름"
            autoFocus
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="text"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="설명 (선택)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowNew(false)} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700">
              취소
            </button>
            <button type="submit" disabled={saving || !name.trim()} className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400">불러오는 중...</div>
      ) : pools.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          문항풀이 없습니다
        </div>
      ) : (
        <div className="grid gap-3">
          {pools.map(pool => (
            <Link
              key={pool.id}
              to={`/pools/${pool.id}`}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 transition-colors block"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{pool.name}</h3>
                  {pool.description && <p className="text-xs text-slate-500 mt-0.5">{pool.description}</p>}
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-primary-600">{pool.question_count}</span>
                  <span className="text-xs text-slate-400 ml-1">문항</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
