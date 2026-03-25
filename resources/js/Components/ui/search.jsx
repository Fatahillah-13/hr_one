import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search as SearchIcon } from "lucide-react";

const defaultSuggestions = [
  { id: 1, title: "People Portal", division: "HR IT", initials: "PP", color: "#4F46E5" },
  { id: 2, title: "Employee Hub", division: "HI", initials: "EH", color: "#0EA5E9" },
  { id: 3, title: "Learning Space", division: "OD/Training", initials: "LS", color: "#F59E0B" },
  { id: 4, title: "Payroll Center", division: "Payroll", initials: "PC", color: "#EC4899" },
  { id: 5, title: "Talent Flow", division: "Rekrutmen", initials: "TF", color: "#22C55E" },
  { id: 6, title: "Care Line", division: "Konseling", initials: "CL", color: "#6366F1" },
];

export default function Search({
  value = "",
  onChange,
  onSubmit,
  placeholder = "Cari sistem yang anda butuhkan",
}) {
  const [internalValue, setInternalValue] = useState(value);
  const [suggestions, setSuggestions] = useState(defaultSuggestions);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const isControlled = typeof onChange === "function";

  useEffect(() => {
    if (isControlled) {
      setInternalValue(value ?? "");
    }
  }, [isControlled, value]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const currentValue = useMemo(() => {
    if (!isControlled || value === undefined || value === null) {
      return internalValue;
    }
    return value;
  }, [internalValue, isControlled, value]);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setInternalValue(nextValue);
    setIsOpen(true);
    onChange?.(nextValue);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(currentValue);
    setIsOpen(false);
  };

  const filteredSuggestions = useMemo(() => {
    const query = currentValue.trim().toLowerCase();
    if (!query) {
      return suggestions.slice(0, 5);
    }

    return suggestions
      .filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.division.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [currentValue, suggestions]);

  const handleClearAll = () => {
    setSuggestions([]);
  };

  const handlePickSuggestion = (item) => {
    setInternalValue(item.title);
    onChange?.(item.title);
    onSubmit?.(item.title);
    setIsOpen(false);
  };

  return (
    <form
      ref={wrapperRef}
      onSubmit={handleSubmit}
      className="relative w-full max-w-[780px]"
      autoComplete="off"
    >
      <label className="sr-only" htmlFor="header-system-search">
        Search systems
      </label>
      <div className="relative p-px rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 shadow-[0_10px_30px_rgba(14,116,144,0.35)]">
        <div className="flex h-12 items-center gap-3 rounded-[15px] border border-white/70 bg-white/90 px-3 backdrop-blur sm:h-[50px] sm:px-4">
          <SearchIcon className="h-5 w-5 shrink-0 text-[#1f2937]" aria-hidden="true" />
          <input
            id="header-system-search"
            ref={inputRef}
            type="search"
            value={currentValue}
            onChange={handleChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="h-full w-full border-0 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 sm:text-base"
          />
          <span className="hidden rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500 sm:inline-flex">
            Ctrl+K
          </span>
        </div>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-3xl border border-[#DDE5EF] bg-white/95 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.22)] backdrop-blur">
          {filteredSuggestions.length > 0 ? (
            <>
              <div className="mb-2 flex items-center justify-between px-2 py-1">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#6B7280]">RECENT SEARCH</p>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleClearAll}
                  className="text-sm text-[#6B7280] transition hover:text-[#374151]"
                >
                  Clear all
                </button>
              </div>

              <ul className="space-y-2">
              {filteredSuggestions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handlePickSuggestion(item)}
                    className="flex w-full items-center justify-between rounded-xl bg-[#F3F4F6] px-3 py-2.5 text-left transition hover:bg-[#EAEFF7]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.initials}
                      </span>
                      <span className="truncate text-sm font-medium text-[#1F2937]">{item.title}</span>
                    </div>
                    <span className="ml-3 shrink-0 text-sm text-[#6B7280]">{item.division}</span>
                  </button>
                </li>
              ))}
              </ul>
            </>
          ) : (
            <p className="px-3 py-2 text-sm text-gray-500">Tidak ada hasil pencarian.</p>
          )}
        </div>
      ) : null}
    </form>
  );
}
