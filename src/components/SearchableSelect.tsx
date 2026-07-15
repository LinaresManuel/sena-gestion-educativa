import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  label?: string;
  placeholder?: string;
}

export default function SearchableSelect({ value, onChange, options, label, placeholder = "Todos" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = value !== "";
  const selectedLabel = options.find(o => o.value === value)?.label ?? "";

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  function handleSelect(opt: Option) {
    onChange(opt.value);
    setIsOpen(false);
    setSearch("");
  }

  function handleClear(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition min-w-[140px] ${
          hasValue
            ? 'border-purple-300 bg-purple-50/30'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label && (
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">
            {label}
          </span>
        )}
        <span className={`truncate flex-1 ${hasValue ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
          {hasValue ? selectedLabel : placeholder}
        </span>
        {hasValue ? (
          <button onClick={handleClear} className="shrink-0 text-gray-400 hover:text-gray-600 transition p-0.5 -mr-0.5">
            <X className="w-3 h-3" />
          </button>
        ) : (
          <ChevronDown className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden origin-top transition">
          <div className="relative border-b border-gray-100">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full border-0 pl-8 pr-3 py-2 text-xs outline-none focus:ring-0"
            />
          </div>
          <div className="max-h-48 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-gray-400 text-center">Sin resultados</div>
            ) : (
              filtered.map((opt, idx) => {
                const isAllOption = opt.value === "";
                const isActive = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    className={`px-3 py-1.5 text-xs cursor-pointer transition flex items-center gap-2 ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    } ${isAllOption && idx === 0 ? 'border-b border-gray-100 mb-1' : ''}`}
                    onClick={() => handleSelect(opt)}
                    title={opt.label}
                  >
                    {isActive && <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0" />}
                    <span className={`flex-1 truncate ${isActive ? 'pl-0' : 'pl-3'}`}>{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
