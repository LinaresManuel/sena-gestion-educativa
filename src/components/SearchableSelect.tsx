import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
}

export default function SearchableSelect({ value, onChange, options }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div ref={containerRef} className="relative">
      <div
        className="border rounded-lg px-2 py-1.5 text-xs bg-white max-w-[180px] overflow-hidden text-ellipsis cursor-pointer flex items-center gap-1 hover:border-gray-400 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Search className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="truncate">{selectedLabel || "Seleccionar..."}</span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border rounded-lg shadow-lg z-20">
          <div className="p-1.5 border-b">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-purple-500/30"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">Sin resultados</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.value}
                  className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-purple-50 transition ${
                    opt.value === value
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'text-gray-700'
                  }`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
