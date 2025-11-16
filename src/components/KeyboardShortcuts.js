import { useEffect } from 'react';

const KeyboardShortcuts = ({ 
  onQuickAdd, 
  onOpenPomodoro, 
  onOpenStats, 
  onOpenThemes, 
  onFocusSearch 
}) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K - Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onFocusSearch();
      }
      
      // Ctrl/Cmd + N - Quick add task
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onQuickAdd();
      }
      
      // Ctrl/Cmd + P - Open Pomodoro
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        onOpenPomodoro();
      }
      
      // Ctrl/Cmd + S - Open Stats
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onOpenStats();
      }
      
      // Ctrl/Cmd + T - Open Themes
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        onOpenThemes();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onQuickAdd, onOpenPomodoro, onOpenStats, onOpenThemes, onFocusSearch]);

  return null;
};

export default KeyboardShortcuts;