import { DOMAINS, COGNITIVE_LEVELS, QUESTION_FORMATS } from '../../../lib/constants'
import type { Topic } from '../../../types'

interface Props {
  domain: string
  cognitiveLevel: string
  questionFormat: string
  topicCode: string
  topics: Topic[]
  onChange: (key: string, value: string) => void
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">선택</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export default function McqLabelForm({ domain, cognitiveLevel, questionFormat, topicCode, topics, onChange }: Props) {
  const filteredTopics = domain ? topics.filter(t => t.domain === domain) : topics

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">분류 (라벨링)</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Select
          label="영역"
          value={domain}
          onChange={v => { onChange('domain', v); onChange('topic_code', '') }}
          options={Object.entries(DOMAINS).map(([k, v]) => ({ value: k, label: `${k} ${v}` }))}
        />
        <Select
          label="인지수준"
          value={cognitiveLevel}
          onChange={v => onChange('cognitive_level', v)}
          options={Object.entries(COGNITIVE_LEVELS).map(([k, v]) => ({ value: k, label: `${k} ${v}` }))}
        />
        <Select
          label="문제형식"
          value={questionFormat}
          onChange={v => onChange('question_format', v)}
          options={Object.entries(QUESTION_FORMATS).map(([k, v]) => ({ value: k, label: `${k} ${v}` }))}
        />
        <Select
          label="토픽"
          value={topicCode}
          onChange={v => onChange('topic_code', v)}
          options={filteredTopics.map(t => ({ value: t.code, label: `${t.code} ${t.name}` }))}
        />
      </div>
    </div>
  )
}
