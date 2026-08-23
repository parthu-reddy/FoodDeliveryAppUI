import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Category {
  id: string;
  name: string;
}

interface CategorySelectorProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CategorySelector({ categories, value, onChange, placeholder = "Select a category", className = "" }: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const selectedCategory = categories.find(c => c.id === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6] hover:border-rose-500/50 transition-colors outline-none"
      >
        <span className={selectedCategory ? "" : "text-slate-400"}>
          {selectedCategory ? selectedCategory.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-lg shadow-xl overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-rose-500/10">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950/50 rounded-md pl-7 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-rose-500/50 dark:text-[#f0ede6]"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onChange(cat.id);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors dark:text-[#f0ede6]"
                >
                  {cat.name}
                  {value === cat.id && <Check className="w-3 h-3 text-emerald-500" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                No categories found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
