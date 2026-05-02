import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const CustomDatePicker = ({ 
  value, 
  onChange, 
  label, 
  placeholder = "Select date",
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Use local date string to avoid timezone shifts
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === viewDate.getMonth() && 
           today.getFullYear() === viewDate.getFullYear();
  };

  const isSelected = (day) => {
    return selectedDate && 
           selectedDate.getDate() === day && 
           selectedDate.getMonth() === viewDate.getMonth() && 
           selectedDate.getFullYear() === viewDate.getFullYear();
  };

  const renderDays = () => {
    const days = [];
    const totalDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const startDay = firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      days.push(
        <button
          key={d}
          type="button"
          onClick={() => handleDateSelect(d)}
          className={`
            h-9 w-9 flex items-center justify-center rounded-lg text-xs font-medium transition-all
            ${isSelected(d) ? 'bg-primary text-white shadow-lg shadow-primary/30' : 
              isToday(d) ? 'bg-primary/10 text-primary border border-primary/20' : 
              'text-textPrimary hover:bg-bgElevated'}
          `}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-textMuted mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between
          bg-bgElevated border border-borderBase rounded-xl px-4 py-2.5 
          text-sm text-textPrimary text-left
          focus:outline-none focus:border-primary transition-all
          ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}
        `}
      >
        <span className={!value ? "text-textMuted" : ""}>
          {value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : placeholder}
        </span>
        <CalendarIcon size={16} className="text-textMuted" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute z-50 mt-2 p-4 bg-bgSurface border border-borderBase rounded-2xl shadow-2xl w-[280px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-textPrimary">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h4>
              <div className="flex gap-1">
                <button type="button" onClick={handlePrevMonth} className="p-1.5 hover:bg-bgElevated rounded-lg text-textMuted transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={handleNextMonth} className="p-1.5 hover:bg-bgElevated rounded-lg text-textMuted transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="h-9 flex items-center justify-center text-[10px] font-bold text-textMuted uppercase">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {renderDays()}
            </div>

            {value && (
              <button
                type="button"
                onClick={() => { onChange(""); setIsOpen(false); }}
                className="w-full mt-4 py-2 text-[10px] font-bold uppercase tracking-wider text-danger hover:bg-danger/10 rounded-lg transition-colors"
              >
                Clear Selection
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDatePicker;
