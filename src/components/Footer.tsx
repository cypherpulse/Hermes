import React from 'react';

export function Footer() {
  return (
    <footer className="w-full mt-12 border-t border-border bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 backdrop-blur-xl py-8 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-50 shadow-inner">
      <div className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-100">
        <span className="text-gray-900 dark:text-gray-100">© {new Date().getFullYear()} Hermes</span>
        <span className="hidden sm:inline text-gray-900 dark:text-gray-100">|</span>
        <span className="text-xs text-gray-900 dark:text-gray-100">Multichain USDC Bridge</span>
      </div>
      <div className="flex items-center gap-5">
        <a href="https://x.com/HermesBridge" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-700 dark:text-orange-200 hover:text-black dark:hover:text-white transition-colors">
            <path d="M17.53 3H21.5L14.5 10.98L22.75 21H16.31L11.38 14.78L5.78 21H1.8L9.2 12.52L1.25 3H7.86L12.33 8.67L17.53 3ZM16.41 19H18.23L7.68 4.89H5.73L16.41 19Z" fill="currentColor"/>
          </svg>
        </a>
        <a href="https://www.linkedin.com/company/hermes0" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 transition-colors">
            <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.27c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76 1.75.79 1.75 1.76-.78 1.76-1.75 1.76zm13.5 11.27h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-10h2.88v1.36h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v5.59z" fill="currentColor"/>
          </svg>
        </a>
      </div>
    </footer>
  );
}
