import React from 'react';

export const PasswordChecklist = ({ password = '' }) => {
  const hasMin = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const rules = [
    { label: 'Must be at least 8 characters', met: hasMin },
    { label: 'Must contain at least one uppercase letter (A-Z)', met: hasUpper },
    { label: 'Must contain at least one lowercase letter (a-z)', met: hasLower },
    { label: 'Must contain at least one number (0-9)', met: hasNumber },
    { label: 'Must contain at least one special character (e.g. @Admin123)', met: hasSpecial },
  ];

  return (
    <div className="space-y-1.5 pt-2 text-xs text-left">
      {rules.map((rule, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-2 transition-colors ${
            rule.met ? 'text-primary font-bold' : 'text-on-surface-variant'
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 transition-all ${
              rule.met
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-high border border-outline-variant text-transparent'
            }`}
          >
            ✓
          </span>
          <span>{rule.label}</span>
        </div>
      ))}
    </div>
  );
};
