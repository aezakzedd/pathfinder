import React from 'react'

export default function Button({children, className = '', ...props}: React.ButtonHTMLAttributes<HTMLButtonElement>){
  return (
    <button
      {...props}
      className={
        'inline-flex items-center px-4 py-2 rounded-2xl shadow-sm ring-offset-background focus:outline-none ' +
        'bg-[var(--primary)] text-white hover:opacity-95 ' + className
      }
    >
      {children}
    </button>
  )
}

