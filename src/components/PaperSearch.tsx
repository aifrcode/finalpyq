import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { School, ExamType, SCHOOLS, EXAM_TYPES, SEMESTERS } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SearchFilters {
  query: string;
  school: School | '';
  examType: ExamType | '';
  semester: number | '';
  year: number | '';
}

interface PaperSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

export function PaperSearch({ onSearch }: PaperSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    school: '',
    examType: '',
    semester: '',
    year: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const clearFilters = () => {
    const resetFilters: SearchFilters = { query: '', school: '', examType: '', semester: '', year: '' };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="relative flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by subject name or code..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`p-4 rounded-2xl border transition-all duration-300 ${showFilters ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
        >
          <Filter className="w-6 h-6" />
        </button>
        <button 
          onClick={handleSearch}
          className="px-8 py-4 rounded-2xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors"
        >
          SEARCH
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">School</label>
                <select 
                  className="w-full p-3 rounded-xl bg-black border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors [&>option]:bg-black"
                  value={filters.school}
                  onChange={(e) => setFilters({ ...filters, school: e.target.value as School })}
                >
                  <option value="">All Schools</option>
                  {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Exam Type</label>
                <select 
                  className="w-full p-3 rounded-xl bg-black border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors [&>option]:bg-black"
                  value={filters.examType}
                  onChange={(e) => setFilters({ ...filters, examType: e.target.value as ExamType })}
                >
                  <option value="">All Exams</option>
                  {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Semester</label>
                <select 
                  className="w-full p-3 rounded-xl bg-black border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors [&>option]:bg-black"
                  value={filters.semester}
                  onChange={(e) => setFilters({ ...filters, semester: e.target.value ? parseInt(e.target.value) : '' })}
                >
                  <option value="">All Semesters</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Year</label>
                <input 
                  type="number" 
                  placeholder="e.g. 2023"
                  className="w-full p-3 rounded-xl bg-black border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value ? parseInt(e.target.value) : '' })}
                />
              </div>
              <div className="lg:col-span-4 flex justify-end mt-2">
                <button 
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  CLEAR FILTERS
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
