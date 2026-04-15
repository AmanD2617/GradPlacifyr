import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import './PasswordInput.css'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  wrapperClassName?: string
}

export function PasswordInput({ wrapperClassName = '', className = '', ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className={`pw-wrapper ${wrapperClassName}`}>
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={`pw-input ${className}`}
      />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
